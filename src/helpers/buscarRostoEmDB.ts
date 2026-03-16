import * as faceapi from "face-api.js";
import { FACE_CONFIDENCE_THRESHOLD } from "../ReconhecimentoFacial/constants";

export const buscarRostoEmDB = async (descriptor: Float32Array) => {
  const savedData = localStorage.getItem("faceUsers");
  if (!savedData) return null;

  const users = JSON.parse(savedData);
  let bestMatch = null;
  let minDistance = 1.0;

  for (const user of users) {
    const savedDescriptor = new Float32Array(user.descriptor);
    const distance = faceapi.euclideanDistance(savedDescriptor, descriptor);

    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = { ...user, distance };
    }
  }

  if (bestMatch && minDistance < FACE_CONFIDENCE_THRESHOLD) {
    return bestMatch;
  }

  return null;
};
