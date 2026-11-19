import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/inter'
import './styles.css'
import App from './App'

document.documentElement.dataset.theme = localStorage.getItem('fv:dark') === 'true' ? 'dark' : 'light'
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
