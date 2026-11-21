export default function ComingSoon({ title }) {
  return (
    <div className="max-w-md mx-auto mt-16 bg-white rounded-xl shadow-sm border p-10 text-center">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="text-slate-500 mt-2">Coming in a later slice</p>
    </div>
  )
}
