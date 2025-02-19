//@ts-nocheck
import express from 'express'
import { Server } from 'http'
import { Bonjour } from 'bonjour-service'
import routes from '../server/routes'
import { initializeDatabase } from '../server/database/client'

export class ExpressServer {
  private app: express.Application
  private server: Server | null = null
  private bonjourInstance = new Bonjour()

  constructor() {
    this.app = express()
    this.setupMiddleware()
    this.setupDatabase()
    this.setupRoutes()
  }

  private setupMiddleware(): void {
    this.app.use(express.json())

    this.app.use((req, res, next) => {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; connect-src 'self' http://localhost:3001; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com"
      )

      next()
    })
  }

  private async setupDatabase(): Promise<void> {
    try {
      // Test database connection
      initializeDatabase()
      console.log('Database connected successfully')

      // Run any initial migrations or seeds if needed
    } catch (error) {
      console.error('Database connection failed:', error)
      throw error
    }
  }

  private setupRoutes(): void {
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok' })
    })
    this.app.use('/api', routes)
  }

  private async findAvailablePort(startPort: number, maxRetries: number = 10): Promise<number> {
    let attemptPort = startPort

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await new Promise<void>((resolve, reject) => {
          const testServer = this.app
            .listen(attemptPort, () => {
              testServer.close(() => resolve()) // Cleanup server before resolving
            })
            .on('error', (err: any) => {
              if (err.code === 'EADDRINUSE') {
                console.log(`⚠️ Port ${attemptPort} is in use. Trying port ${attemptPort + 1}...`)
                attemptPort++ // Increment to next port
                reject(err) // Reject so that the loop continues
              } else {
                reject(err)
              }
            })
        })

        return attemptPort // If we reach here, the port is free
      } catch (error) {
        // If we exhausted retries, throw the error
        if (attempt === maxRetries - 1) {
          throw new Error(`Could not find an available port after ${maxRetries} attempts`)
        }
      }
    }

    throw new Error(' Unexpected error while finding a port')
  }

  public async start(port: number = 3000): Promise<{ serviceName: string; port: number }> {
    try {
      const availablePort = await this.findAvailablePort(port)
      const bonjourServiceName = `pos-main-service-${Math.floor(Math.random() * 1000)}`

      this.server = await this.app.listen(availablePort, () => {
        this.bonjourInstance.publish({
          name: bonjourServiceName,
          type: 'http',
          port: availablePort
        })

        console.log(`Server is running on port ${availablePort}`)
      })

      return {
        serviceName: bonjourServiceName,
        port: availablePort
      }
    } catch (error) {
      console.error('Error starting server:', error.message)
      throw error
    }
  }

  public stop(): void {
    if (this.server) {
      this.server.close()
      this.bonjourInstance.unpublishAll()
      this.bonjourInstance.destroy()
    }
  }
}
