import { createClient } from "@/lib/supabase/client"

export type UploadFilesOptions = {
  bucketName: string
  path?: string
  cacheControl?: number
  upsert?: boolean
}

export type UploadFilesResult = {
  successes: string[]
  errors: { name: string; message: string }[]
}

export async function uploadFiles(
  files: File[],
  options: UploadFilesOptions,
): Promise<UploadFilesResult> {
  const { bucketName, path, cacheControl = 3600, upsert = false } = options
  const supabase = createClient()

  const responses = await Promise.all(
    files.map(async (file) => {
      const objectPath = path ? `${path}/${file.name}` : file.name
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(objectPath, file, {
          cacheControl: cacheControl.toString(),
          upsert,
        })
      return error
        ? { name: file.name, message: error.message }
        : { name: file.name, message: undefined }
    }),
  )

  return {
    successes: responses.filter((r) => !r.message).map((r) => r.name),
    errors: responses
      .filter((r) => r.message !== undefined)
      .map((r) => ({ name: r.name, message: r.message! })),
  }
}
