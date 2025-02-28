import { useEffect } from 'react'
import './App.scss'
import AppRouter from './routes/appRouter'
import { useAppDispatch } from './hooks/hooks'
import { checkUser } from './features/authForm/authSlice'

function App() {

  const dispatch = useAppDispatch()

  useEffect(() => {
    // Запрашиваем продукты при монтировании компонента
    dispatch(checkUser())
  }, [dispatch]);

  return (
    <>
      <AppRouter/> 
      
        
    </>
  )
}

export default App
