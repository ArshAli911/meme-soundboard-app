/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions, https } from "firebase-functions";
import * as admin from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

initializeApp();

const db = getFirestore();
const bucket = getStorage().bucket("gs://meme-app-eabc1.appspot.com");

interface SoundMetadata {
  name: string;
  category: string;
  tags: string[];
  fileName: string;
  contentType: string;
  userId: string;
  uploadDate: admin.firestore.FieldValue;
  downloadUrl: string;
}

export const uploadSound = https.onCall(async (request: https.CallableRequest) => {
  if (!request.auth) {
    throw new https.HttpsError(
      "unauthenticated",
      "Only authenticated users can upload sounds.",
    );
  }

  const { name, category, tags, base64Audio, fileName, contentType } = request.data as {
    name: string;
    category: string;
    tags: string[];
    base64Audio: string;
    fileName: string;
    contentType: string;
  };
  const userId = request.auth.uid;

  if (
    !name ||
    !category ||
    !base64Audio ||
    !fileName ||
    !contentType ||
    !tags
  ) {
    throw new https.HttpsError(
      "invalid-argument",
      "Missing required fields: name, category, tags, base64Audio, fileName, contentType.",
    );
  }

  try {
    const fileBuffer = Buffer.from(base64Audio, "base64");
    const uniqueFileName = `${Date.now()}_${fileName}`;
    const file = bucket.file(`sounds/${uniqueFileName}`);

    await file.save(fileBuffer, {
      metadata: { contentType: contentType },
    });

    await file.makePublic();
    const downloadUrl = file.publicUrl();

    const newSoundRef = await db.collection("sounds").add({
      name,
      category,
      tags,
      fileName: uniqueFileName,
      contentType,
      userId,
      uploadDate: admin.firestore.FieldValue.serverTimestamp(),
      downloadUrl,
    } as SoundMetadata);

    logger.info("Sound uploaded and metadata saved:", {
      soundId: newSoundRef.id,
      userId,
    });

    return { success: true, soundId: newSoundRef.id, downloadUrl };
  } catch (error) {
    logger.error("Error uploading sound:", error);
    throw new https.HttpsError(
      "internal",
      "Failed to upload sound",
      (error as Error).message,
    );
  }
});

export const getSounds = https.onCall(async (request: https.CallableRequest) => {
  if (!request.auth) {
    throw new https.HttpsError(
      "unauthenticated",
      "Authentication required to fetch sounds.",
    );
  }

  const { category, search, limit = 10, lastDocId } = request.data as {
    category?: string;
    search?: string;
    limit?: number;
    lastDocId?: string;
  };
  let query: admin.firestore.Query = db.collection("sounds").orderBy("uploadDate", "desc");

  if (category && category !== "All") {
    query = query.where("category", "==", category);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    query = query
      .where("name", ">=", searchLower)
      .where("name", "<=", searchLower + "\uf8ff");
  }

  if (lastDocId) {
    const lastDocument = await db.collection("sounds").doc(lastDocId).get();
    if (lastDocument.exists) {
      query = query.startAfter(lastDocument);
    }
  }

  const snapshot = await query.limit(limit).get();
  const sounds = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return { sounds };
});

export const favoriteSound = https.onCall(async (request: https.CallableRequest) => {
  if (!request.auth) {
    throw new https.HttpsError(
      "unauthenticated",
      "Authentication required to favorite sounds.",
    );
  }

  const { soundId } = request.data as { soundId: string };
  const userId = request.auth.uid;

  if (!soundId) {
    throw new https.HttpsError("invalid-argument", "Sound ID is required.");
  }

  try {
    await db
      .collection("users")
      .doc(userId)
      .collection("favorites")
      .doc(soundId)
      .set({ favoritedAt: admin.firestore.FieldValue.serverTimestamp() });
    logger.info("Sound favorited:", { soundId, userId });
    return { success: true };
  } catch (error) {
    logger.error("Error favoriting sound:", error);
    throw new https.HttpsError(
      "internal",
      "Failed to favorite sound",
      (error as Error).message,
    );
  }
});

export const unfavoriteSound = https.onCall(async (request: https.CallableRequest) => {
  if (!request.auth) {
    throw new https.HttpsError(
      "unauthenticated",
      "Authentication required to unfavorite sounds.",
    );
  }

  const { soundId } = request.data as { soundId: string };
  const userId = request.auth.uid;

  if (!soundId) {
    throw new https.HttpsError("invalid-argument", "Sound ID is required.");
  }

  try {
    await db
      .collection("users")
      .doc(userId)
      .collection("favorites")
      .doc(soundId)
      .delete();
    logger.info("Sound unfavorited:", { soundId, userId });
    return { success: true };
  } catch (error) {
    logger.error("Error unfavoriting sound:", error);
    throw new https.HttpsError(
      "internal",
      "Failed to unfavorite sound",
      (error as Error).message,
    );
  }
});

export const fetchFavoritedSoundIds = https.onCall(async (request: https.CallableRequest) => {
  if (!request.auth) {
    throw new https.HttpsError(
      "unauthenticated",
      "Authentication required to fetch favorited sound IDs.",
    );
  }

  const userId = request.auth.uid;

  try {
    const snapshot = await db
      .collection("users")
      .doc(userId)
      .collection("favorites")
      .get();
    const favoritedSoundIds = snapshot.docs.map((doc) => doc.id);
    return { favoritedSoundIds };
  } catch (error) {
    logger.error("Error fetching favorited sound IDs:", error);
    throw new https.HttpsError(
      "internal",
      "Failed to fetch favorited sound IDs",
      (error as Error).message,
    );
  }
});

export const getSoundsByIds = https.onCall(async (request: https.CallableRequest) => {
  if (!request.auth) {
    throw new https.HttpsError(
      "unauthenticated",
      "Authentication required to get sounds by IDs.",
    );
  }

  const { soundIds } = request.data as { soundIds: string[] };

  if (!soundIds || soundIds.length === 0) {
    return { sounds: [] };
  }

  try {
    const sounds: FirebaseFirestore.DocumentData[] = [];
    // Firestore `in` query is limited to 10 items
    const chunkSize = 10;
    for (let i = 0; i < soundIds.length; i += chunkSize) {
      const chunk = soundIds.slice(i, i + chunkSize);
      const snapshot = await db
        .collection("sounds")
        .where(admin.firestore.FieldPath.documentId(), "in", chunk)
        .get();
      snapshot.docs.forEach((doc) => {
        sounds.push({ id: doc.id, ...doc.data() });
      });
    }

    return { sounds };
  } catch (error) {
    logger.error("Error getting sounds by IDs:", error);
    throw new https.HttpsError(
      "internal",
      "Failed to get sounds by IDs",
      (error as Error).message,
    );
  }
});
