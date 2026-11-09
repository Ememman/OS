import { useOS } from "../../store/useOS";

const DEFAULT_PHOTO = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600&auto=format&fit=crop";

export default function PhotoWidget() {
  const photoUrl = useOS((s) => s.photoUrl);

  return (
    <div className="w-full md:w-48 h-48 rounded-2xl overflow-hidden shadow-xl border border-white/10 relative group shrink-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-black">
      <img
        src={photoUrl || DEFAULT_PHOTO}
        alt="Placeholder — swap with your own photo"
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      {!photoUrl && (
        <div className="absolute inset-0 bg-gradient-to- from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-2">
          <span className="text-[10px] text-white/80">Placeholder - set yours in Settings &gt; Photo</span>
        </div>
      )}
    </div>
  );
}
