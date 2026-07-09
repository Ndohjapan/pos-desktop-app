import axios from 'axios'
export const UploadImage = (file: string | Blob) => {
  const data = new FormData()
  data.append('file', file)
  if (process.env.CLOUDINARY_UPLOAD_PRESET) {
    data.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET)
  }
  if (process.env.CLOUDINARY_API_KEY) {
    data.append('api_key', process.env.CLOUDINARY_API_KEY)
  }
  data.append('resource_type', 'raw')
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    data.append('cloud_name', process.env.CLOUDINARY_CLOUD_NAME)
  }
  data.append('folder', 'amala-oluyole/foods')

  return new Promise((resolve, reject) => {
    const config = {
      onUploadProgress: (progressEvent: { loaded: number; total?: number }) => {
        if (progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100
          console.log(`Upload Progress: ${progress}%`)
        }
      }
    }

    axios
      .post(
        `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
        data,
        config
      )
      .then((response) => {
        resolve(response.data)
      })
      .catch((error) => {
        console.error(error)
        reject(error)
      })
  })
}
