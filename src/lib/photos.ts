/* Photos : redimensionnées pour tenir dans le stockage local */
export const readPhoto = (file: File, max = 640): Promise<string> => new Promise((res, rej) => {
  const fr = new FileReader()
  fr.onerror = () => rej(new Error('Lecture impossible'))
  fr.onload = () => {
    const img = new Image()
    img.onerror = () => rej(new Error('Image illisible'))
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
      c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height)
      res(c.toDataURL('image/jpeg', 0.72))
    }
    img.src = String(fr.result)
  }
  fr.readAsDataURL(file)
})

export const readPhotos = (files: FileList | File[] | null): Promise<string[]> =>
  Promise.all([...(files || [])].filter(f => f.type.startsWith('image/')).map(f => readPhoto(f)))
