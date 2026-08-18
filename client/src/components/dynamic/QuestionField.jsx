export default function QuestionField({ question, value, onChange, error }) {
  if (question.type === 'number') {
    return (
      <div className="flex flex-col gap-2">
        <label className="text-lg font-semibold text-gray-900">
          {question.label} {question.unit ? <span className="text-gray-400 font-normal">({question.unit})</span> : null}
        </label>
        <input
          type="number"
          inputMode="numeric"
          min={question.min}
          max={question.max}
          value={value ?? ''}
          onChange={(e) => onChange(question.key, e.target.value === '' ? '' : Number(e.target.value))}
          className={`p-4 text-lg border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand w-full ${
            error ? 'border-red-400' : 'border-gray-300'
          }`}
          placeholder={question.min != null && question.max != null ? `Between ${question.min} and ${question.max}` : ''}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  if (question.type === 'select') {
    return (
      <div className="flex flex-col gap-2">
        <label className="text-lg font-semibold text-gray-900">{question.label}</label>
        <div className="grid grid-cols-1 gap-3">
          {(question.options || []).map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => onChange(question.key, opt.value)}
              className={`text-left p-4 border rounded-xl transition flex items-center justify-between ${
                value === opt.value
                  ? 'border-brand bg-brand/5 ring-2 ring-brand'
                  : 'border-gray-300 hover:border-brand/50 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium text-gray-900">{opt.label}</span>
              <span
                className={`h-5 w-5 rounded-full border-2 flex-shrink-0 ${
                  value === opt.value ? 'bg-brand border-brand' : 'border-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  // Unknown question type from the API — fail loud in dev rather than
  // silently rendering nothing, which would be very confusing for Marcus
  // when he adds a question type we don't support yet.
  return (
    <p className="text-sm text-amber-600">
      Unsupported question type "{question.type}" for "{question.label}".
    </p>
  );
}
