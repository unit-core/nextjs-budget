'use client'
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/dropzone'
import { useSupabaseUpload } from '@/hooks/use-supabase-upload'
// import { createClient } from "@/lib/supabase/server";
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { SidebarUser } from "@/components/app-sidebar"
import { toast } from 'sonner';
 
const FileUploadDemo = ({ user }: { user: SidebarUser }) => {

  const router = useRouter()

  const props = useSupabaseUpload({
    bucketName: 'transactions',
    path: user?.id ?? '',
    allowedMimeTypes: ['image/*'],
    maxFiles: 10,
    maxFileSize: 1000 * 1000 * 5, // 5MB
  })
  
  // Эффект для обработки завершения
  useEffect(() => {
    if (props.isSuccess) {
      toast("Transaction has been created", {
        position: 'top-center',
        description: "The system is already processing"
      })
      // console.log("Загрузка завершена", props.successes);
      
      // 1. Показать уведомление (например, через toast)
      // toast.success("Файлы успешно загружены!");
      
      // 2. Обновить страницу, чтобы новые данные подтянулись из Supabase
      // router.refresh(); 
      
      // 3. Или сделать редирект
      // router.push('/dashboard/transactions');
    }
  }, [props.isSuccess, props.successes, router]);
 
  return (
    <div>
    {/* <div className="w-[500px]"> */}
      <Dropzone {...props}>
        <DropzoneEmptyState />
        <DropzoneContent />
      </Dropzone>
    </div>
  )
}
 
export { FileUploadDemo }