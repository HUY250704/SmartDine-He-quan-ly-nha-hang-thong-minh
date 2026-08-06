import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/glass-card.jsx";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <GlassCard className="text-center max-w-md w-full p-10 space-y-6">
        <span className="material-symbols-outlined text-7xl text-on-surface-variant/30">
          restaurant
        </span>
        <h2 className="text-2xl font-bold text-on-surface">Trang không tồn tại</h2>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          Có vẻ bạn đã đi lạc khỏi thực đơn.{' '}
          <br className="hidden sm:block" />
          Hãy quay lại và tiếp tục đặt món nhé!
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm hover:brightness-110 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">home</span>
          Về trang chủ
        </Link>
      </GlassCard>
    </div>
  );
}
