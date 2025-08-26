import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    // Get initial session - Use Promise chain
    supabase?.auth?.getSession()?.then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session?.user)
          getUserProfile(session?.user?.id).then(setUserProfile)
        }
        setLoading(false)
      })?.catch((error) => {
        console.error('Session error:', error)
        setLoading(false)
      })

    // Listen for auth changes - NEVER ASYNC callback
    const { data: { subscription } } = supabase?.auth?.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session?.user)
          getUserProfile(session?.user?.id).then(setUserProfile)  // Fire-and-forget, NO AWAIT
        } else {
          setUser(null)
          setUserProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  

  const signIn = async (email, password) => {
    try {
      setAuthError('')
      const { data, error } = await supabase?.auth?.signInWithPassword({
        email,
        password
      })

      if (error) {
        setAuthError(error?.message)
        return { error }
      }

      if (data?.user) {
        setUser(data?.user)
        const userProfile = await getUserProfile(data?.user?.id)
        setUserProfile(userProfile)
        return { user: data?.user, userProfile };
      }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('AuthRetryableFetchError')) {
        setAuthError('Cannot connect to authentication service. Your Supabase project may be paused or inactive.')
        return { error: { message: 'Connection error. Please try again.' } }
      }
      setAuthError('Sign in failed. Please try again.')
      return { error: { message: 'Sign in failed. Please try again.' } }
    }
  }

  const signUp = async (email, password, userData = {}) => {
    try {
      setAuthError('')
      const { data, error } = await supabase?.auth?.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData?.firstName || '',
            last_name: userData?.lastName || '',
            role: userData?.role || 'sales_rep'
          }
        }
      })

      if (error) {
        setAuthError(error?.message)
        return { error }
      }

      return { user: data?.user }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        setAuthError('Cannot connect to authentication service. Please check your network connection.')
        return { error: { message: 'Connection error. Please try again.' } }
      }
      setAuthError('Sign up failed. Please try again.')
      return { error: { message: 'Sign up failed. Please try again.' } }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase?.auth?.signOut()
      if (error) {
        console.error('Sign out error:', error)
      } else {
        setUser(null)
        setUserProfile(null)
        setAuthError('')
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const getUserProfile = async (userId) => {
    if (!userId) return null
    
    const { data, error } = await supabase?.from('user_profiles')?.select('*')?.eq('id', userId)?.single()

    if (error && error?.code !== 'PGRST116') {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  }

  const updateUserProfile = async (userId, updates) => {
    const { data, error } = await supabase?.from('user_profiles')?.update(updates)?.eq('id', userId)?.select()?.single()

    return { data, error }
  }

  const clearAuthError = () => setAuthError('')

  const value = {
    user,
    userProfile,
    loading,
    authError,
    signIn,
    signUp,
    signOut,
    getUserProfile,
    updateUserProfile,
    clearAuthError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}