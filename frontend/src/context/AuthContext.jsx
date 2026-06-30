import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  const checkSetupStatus = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/setup-check`);
      const data = await res.json();
      setSetupRequired(data.setupRequired);
    } catch (err) {
      console.error('Error checking setup status:', err);
    }
  };


  const checkAuthToken = async (savedToken) => {
    if (!savedToken) {
      setLoading(false);
      return;
    }

    const savedUser = localStorage.getItem('user');

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    setLoading(false);
  };


  useEffect(() => {
    const initAuth = async () => {
      await checkSetupStatus();

      const storedToken = localStorage.getItem('token');

      if (storedToken) {
        setToken(storedToken);
        await checkAuthToken(storedToken);
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, []);


  const login = async (username, password) => {
    try {
console.log("API URL:", import.meta.env.VITE_API_URL);
     const response = await fetch(
  `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username,
            password
          })
        }
      );


      const data = await response.json();


      if (!response.ok) {
        return {
          success: false,
          message: data.message || "Login failed"
        };
      }


      localStorage.setItem(
        "token",
        data.token
      );


      const userData = {
        _id: data._id,
        username: data.username,
        role: data.role,
        employee: data.employee
      };


      localStorage.setItem(
        "user",
        JSON.stringify(userData)
      );


      setToken(data.token);
      setUser(userData);


      return {
        success: true
      };


    } catch (error) {

      return {
        success: false,
        message: error.message
      };

    }
  };


  const setupAdmin = async (username, password) => {

    try {

     const res = await fetch(
  `${import.meta.env.VITE_API_URL}/api/auth/setup-admin`,
        {
          method: "POST",
          headers:{
            "Content-Type":"application/json"
          },
          body: JSON.stringify({
            username,
            password
          })
        }
      );


      const data = await res.json();


      if(!res.ok){
        throw new Error(data.message);
      }


      localStorage.setItem(
        "token",
        data.token
      );


      setToken(data.token);


      return {
        success:true
      };


    } catch(error){

      return {
        success:false,
        message:error.message
      };

    }

  };


  const logout = () => {

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setToken('');
    setUser(null);

  };


  const refreshUser = (updatedEmployee)=>{

    if(user){

      const updatedUser={
        ...user,
        employee:updatedEmployee
      };

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      setUser(updatedUser);

    }

  };


  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        setupRequired,
        login,
        logout,
        setupAdmin,
        checkSetupStatus,
        refreshUser
      }}
    >
      {children}

    </AuthContext.Provider>
  );

};


export const useAuth = () => useContext(AuthContext);