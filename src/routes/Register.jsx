import { useState } from 'react'
import { useAuth } from '../main'
import { Link, useNavigate } from 'react-router-dom'

export default function Register(){
  const nav = useNavigate()
  const { registerEmail } = useAuth()
  const [email,setEmail]=useState(''), [pass,setPass]=useState(''), [name,setName]=useState(''), [err,setErr]=useState('')

  const submit = async (e)=>{
    e.preventDefault()
    try { await registerEmail(email, pass, name); nav('/') } catch(e){ setErr(e.message) }
  }

  return (
    <div className="mx-auto max-w-sm p-4">
      <h1 className="text-2xl font-bold mb-4">Create account</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border rounded p-2" placeholder="Display name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="w-full border rounded p-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border rounded p-2" placeholder="Password" type="password" value={pass} onChange={e=>setPass(e.target.value)} />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="w-full border rounded p-2">Register</button>
      </form>
      <p className="mt-4 text-sm">Already have an account? <Link to="/login" className="underline">Sign in</Link></p>
    </div>
  )
}