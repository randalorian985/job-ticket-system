export function Errorable({ error }: { error: string | null }) { return error ? <p className="error">{error}</p> : null }
