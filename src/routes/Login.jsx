import { useState } from 'react'
import { useAuth } from '../main'
import { Link, useNavigate } from 'react-router-dom'

export default function Login(){
  const nav = useNavigate()
  const { signInEmail, signInGoogle } = useAuth()
  const [email,setEmail]=useState(''), [pass,setPass]=useState(''), [err,setErr]=useState('')

  const submit = async (e)=>{
    e.preventDefault()
    try { await signInEmail(email, pass); nav('/') } catch(e){ setErr(e.message) }
  }
  return (
    <div className="mx-auto max-w-sm p-4">
      <h1 className="text-2xl font-bold mb-4">Sign in</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border rounded p-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border rounded p-2" placeholder="Password" type="password" value={pass} onChange={e=>setPass(e.target.value)} />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="w-full border rounded p-2">Sign in</button>
      </form>
      <button className="w-full border rounded p-2 mt-3" onClick={async()=>{ try{ await signInGoogle(); nav('/') }catch(e){ setErr(e.message) } }}>
        Continue with Google
      </button>
      <p className="mt-4 text-sm">No account? <Link to="/register" className="underline">Register</Link></p>
    </div>
  )
}