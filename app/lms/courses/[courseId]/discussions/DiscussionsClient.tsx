'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Plus, Send, Loader2, ChevronDown, ChevronRight, CheckCircle, Pin } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { EmptyState } from '@/components/shared';
import { fRelative, getInitials, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function DiscussionsClient({ discussions, courseId, userId, userName, section }: { discussions:any[];courseId:string;userId:string;userName:string;section:any }) {
  const { i18n }=useTranslation(); const isRTL=i18n.language==='ar';
  const router=useRouter(); const sb=createClient();
  const [expanded,setExpanded]=useState<string|null>(null);
  const [replies,setReplies]=useState<Record<string,any[]>>({});
  const [replyText,setReplyText]=useState<Record<string,string>>({});
  const [newThread,setNewThread]=useState({open:false,title:'',body:''});
  const [loading,setLoading]=useState<string|null>(null);
  const courseName=isRTL?section.course?.name_ar:section.course?.name_en;

  const loadReplies=async(discussionId:string)=>{
    if(replies[discussionId]) return;
    const {data}=await sb.from('lms_replies').select('*,author:profiles(id,full_name,full_name_ar)').eq('discussion_id',discussionId).order('created_at');
    setReplies(p=>({...p,[discussionId]:data??[]}));
  };

  const toggleThread=async(id:string)=>{
    if(expanded===id){setExpanded(null);}
    else{setExpanded(id);await loadReplies(id);}
  };

  const postThread=async()=>{ if(!newThread.title.trim()||!newThread.body.trim()) return; setLoading('new');
    const {error}=await sb.from('lms_discussions').insert({section_id:courseId,author_id:userId,title:newThread.title.trim(),body:newThread.body.trim()});
    if(error){toast.error('فشل النشر');setLoading(null);return;}
    toast.success('تم نشر الموضوع'); setNewThread({open:false,title:'',body:''}); setLoading(null); router.refresh(); };

  const postReply=async(discussionId:string)=>{ const text=replyText[discussionId]?.trim(); if(!text) return; setLoading(discussionId);
    const {data,error}=await sb.from('lms_replies').insert({discussion_id:discussionId,author_id:userId,body:text}).select('*,author:profiles(id,full_name,full_name_ar)').single();
    if(error){toast.error('فشل الرد');setLoading(null);return;}
    setReplies(p=>({...p,[discussionId]:[...(p[discussionId]??[]),data]}));
    setReplyText(p=>({...p,[discussionId]:''})); setLoading(null); };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-gray-900">النقاشات</h1><p className="text-sm text-gray-500">{courseName}</p></div>
        <button onClick={()=>setNewThread(p=>({...p,open:!p.open}))} className="btn-primary text-sm"><Plus className="w-4 h-4"/>موضوع جديد</button>
      </div>

      {newThread.open&&(
        <div className="card p-5 space-y-3 animate-slide-up">
          <input value={newThread.title} onChange={e=>setNewThread(p=>({...p,title:e.target.value}))} placeholder="عنوان الموضوع *" className="input font-semibold"/>
          <textarea value={newThread.body} onChange={e=>setNewThread(p=>({...p,body:e.target.value}))} rows={4} placeholder="اكتب موضوعك..." className="input resize-none"/>
          <div className="flex gap-3"><button onClick={()=>setNewThread({open:false,title:'',body:''})} className="btn-secondary flex-1">إلغاء</button><button onClick={postThread} disabled={loading==='new'} className="btn-primary flex-1">{loading==='new'?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}نشر</button></div>
        </div>
      )}

      {discussions.length===0?<EmptyState icon={MessageSquare} title="لا توجد نقاشات" description="ابدأ أول موضوع"/>:(
        <div className="space-y-3">
          {discussions.map(disc=>{
            const isOpen=expanded===disc.id;
            const author=disc.author;
            const authorName=isRTL?author?.full_name_ar??author?.full_name:author?.full_name;
            const discReplies=replies[disc.id]??[];
            return (
              <div key={disc.id} className={cn('card overflow-hidden',disc.is_pinned&&'border-amber-200')}>
                <button onClick={()=>toggleThread(disc.id)} className="w-full flex items-start gap-3 p-4 hover:bg-gray-50 text-start">
                  <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 text-sm font-bold flex items-center justify-center shrink-0">{getInitials(author?.full_name??'U')}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">{disc.is_pinned&&<Pin className="w-3 h-3 text-amber-500"/>}<p className="text-sm font-bold text-gray-800">{disc.title}</p></div>
                    <p className="text-xs text-gray-500 truncate">{disc.body.slice(0,80)}{disc.body.length>80?'...':''}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                      <span>{authorName}</span><span>{fRelative(disc.created_at,isRTL?'ar':'en')}</span>
                      <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3"/>{disc.replies_count??0}</span>
                    </div>
                  </div>
                  {isOpen?<ChevronDown className="w-4 h-4 text-gray-300 shrink-0"/>:<ChevronRight className="w-4 h-4 text-gray-300 shrink-0"/>}
                </button>
                {isOpen&&(
                  <div className="border-t border-gray-100 p-4 animate-fade-in">
                    <p className="text-sm text-gray-700 mb-4 leading-relaxed">{disc.body}</p>
                    {discReplies.map((rep:any)=>{
                      const repName=isRTL?rep.author?.full_name_ar??rep.author?.full_name:rep.author?.full_name;
                      return (
                        <div key={rep.id} className={cn('flex gap-3 mb-3',rep.is_answer&&'bg-green-50 rounded-xl p-3 border border-green-200')}>
                          <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center shrink-0">{getInitials(rep.author?.full_name??'U')}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5"><span className="text-xs font-semibold text-gray-700">{repName}</span>{rep.is_answer&&<span className="badge-green badge text-[10px] flex items-center gap-0.5"><CheckCircle className="w-2.5 h-2.5"/>إجابة مقبولة</span>}</div>
                            <p className="text-sm text-gray-700">{rep.body}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{fRelative(rep.created_at,isRTL?'ar':'en')}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex gap-2 mt-3">
                      <input value={replyText[disc.id]??''} onChange={e=>setReplyText(p=>({...p,[disc.id]:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();postReply(disc.id);}}} placeholder="اكتب رداً..." className="input flex-1 text-sm py-2"/>
                      <button onClick={()=>postReply(disc.id)} disabled={loading===disc.id||!replyText[disc.id]?.trim()} className="btn-primary py-2 px-3">{loading===disc.id?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
