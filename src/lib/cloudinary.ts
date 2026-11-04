import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

/**
 * Configura Cloudinary usando CLOUDINARY_URL (lee automáticamente
 * cloud_name, api_key y api_secret de la URL de conexión).
 */
cloudinary.config({
  secure: true,
});

/**
 * Sube un archivo (Buffer) a Cloudinary.
 * Devuelve la URL segura, el public_id y metadatos útiles.
 * Lanza un error si falla la subida.
 */
export async function uploadFile(
  buffer: Buffer,
  options: {
    folder?: string;
    resourceType?: "image" | "video" | "raw" | "auto";
    publicId?: string;
    filename?: string;
  } = {}
): Promise<{
  url: string;
  secureUrl: string;
  publicId: string;
  resourceType: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
}> {
  const {
    folder = "constr-art",
    resourceType = "auto",
    publicId,
    filename,
  } = options;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: publicId,
        use_filename: !!filename,
        unique_filename: !!filename,
        overwrite: !!publicId,
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          reject(error ?? new Error("Error desconocido al subir a Cloudinary"));
          return;
        }
        resolve({
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
          duration: result.duration,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Elimina un archivo de Cloudinary por su public_id.
 * Devuelve true si se eliminó (o no existía), false si falló.
 */
export async function deleteFile(publicId: string, resourceType: "image" | "video" | "raw" = "image"): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result.result === "ok";
  } catch {
    return false;
  }
}

export default cloudinary;
