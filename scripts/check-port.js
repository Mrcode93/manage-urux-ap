#!/usr/bin/env node

import { getPort } from 'portfinder'

async function checkPorts() {
  try {
    console.log('🔍 Checking port availability...')
    
    let port = 5173
    let message = ''
    
    try {
      // Try to get port 5173
      port = await getPort({ port: 5173 })
      message = `✅ Port 5173 is available!`
    } catch (error) {
      // If 5173 is not available, try 5174
      try {
        port = await getPort({ port: 5174 })
        message = `⚠️  Port 5173 is in use, port 5174 is available`
      } catch (error2) {
        // If both ports are busy, let portfinder find any available port
        port = await getPort({ port: 5175 })
        message = `⚠️  Ports 5173 and 5174 are in use, found available port: ${port}`
      }
    }
    
    console.log(message)
    console.log(`🎯 Final port selected: ${port}`)
    
  } catch (error) {
    console.error('❌ Error checking ports:', error.message)
  }
}

checkPorts() 