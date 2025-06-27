import { useState, useEffect } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import PaymentForm from './payment-form'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { apiRequest } from '@/lib/queryClient'

// Initialize Stripe outside component to avoid recreating
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!)

interface StripePaymentWrapperProps {
  amount: number
  type: 'full_payment' | 'authorization'
  bookingId?: number
  onSuccess: (result: any) => void
  onError: (error: string) => void
}

export default function StripePaymentWrapper({
  amount,
  type,
  bookingId,
  onSuccess,
  onError
}: StripePaymentWrapperProps) {
  const [clientSecret, setClientSecret] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        setLoading(true)
        setError('')

        const endpoint = type === 'authorization' 
          ? '/api/authorize-card' 
          : '/api/create-payment-intent'

        const response = await apiRequest('POST', endpoint, {
          amount,
          bookingId,
          type
        })

        const data = await response.json()
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
        } else {
          throw new Error('No client secret received')
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to initialize payment'
        setError(errorMessage)
        onError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (amount > 0) {
      createPaymentIntent()
    }
  }, [amount, type, bookingId, onError])

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Initializing payment...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-8">
          <div className="text-center text-red-600">
            <p className="font-medium">Payment initialization failed</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!clientSecret) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-8">
          <div className="text-center text-gray-600">
            <p>Unable to initialize payment</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#3b82f6',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm
        amount={amount}
        type={type}
        onSuccess={onSuccess}
        onError={onError}
        isProcessing={loading}
      />
    </Elements>
  )
}