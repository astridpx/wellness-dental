import { useDropZone, useFileDialog } from '@vueuse/core'
import { ref, type ShallowRef } from 'vue'

/**
 *
 * @param dropZoneRef dynamic ref dropzone
 * @returns
 */
export function useFile(dropZoneRef: Readonly<ShallowRef<HTMLElement | null>>) {
  // USE DROPZONE
  const uploadedFiles = ref<File[]>([]) // list of uploaded files

  function onDrop(files: File[] | null) {
    if (!files?.length) return

    Array.from(files).forEach((file) => {
      const exists = uploadedFiles.value.some(
        (f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified,
      )

      if (!exists) {
        uploadedFiles.value.push(file)
      }
    })
  }
  const { isOverDropZone } = useDropZone(dropZoneRef, {
    onDrop,
    dataTypes: ['image/jpeg', 'image/png', 'image/jpg'],
    multiple: true,
    preventDefaultForUnhandled: false,
  })

  // FILE DIALOG
  const {
    files,
    open: openFileDialog,
    reset,
    onCancel: fileDialogCancel,
    onChange: fileDialogChange,
  } = useFileDialog({
    accept: 'image/*',
    multiple: true,
  })

  fileDialogChange((files) => {
    if (!files) return

    Array.from(files as FileList).forEach((file: File) => {
      const exists = uploadedFiles.value.some(
        (f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified,
      )

      if (!exists) {
        uploadedFiles.value.push(file)
      }
    })
  })

  function removeFile(index: number) {
    uploadedFiles.value.splice(index, 1)
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`
    }

    const kb = bytes / 1024
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`
    }

    const mb = kb / 1024
    if (mb < 1024) {
      return `${mb.toFixed(1)} MB`
    }

    const gb = mb / 1024
    return `${gb.toFixed(1)} GB`
  }

  function viewFile(file: File) {
    const url = URL.createObjectURL(file)

    window.open(url, '_blank', 'noopener,noreferrer')

    // Clean up the object URL after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return {
    uploadedFiles,
    fileDialogChange,
    fileDialogCancel,
    reset,
    openFileDialog,
    removeFile,
    viewFile,
    formatFileSize,
  }
}
