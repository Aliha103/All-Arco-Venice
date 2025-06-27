import { useState } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PaymentFormProps {
  amount: number
  type: 'full_payment' | 'authorization'
  onSuccess: (result: any) => void
  onError: (error: string) => void
  isProcessing?: boolean
}

export default function PaymentForm({ 
  amount, 
  type, 
  onSuccess, 
  onError,
  isProcessing = false 
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking-confirmation`,
        },
        redirect: 'if_required'
      })

      if (error) {
        onError(error.message || 'Payment failed')
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        })
      } else if (paymentIntent) {
        onSuccess({
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100, // Convert from cents
        })
        
        toast({
          title: type === 'authorization' ? "Card Authorized" : "Payment Successful",
          description: type === 'authorization' 
            ? "Your card has been authorized successfully"
            : "Thank you for your payment!",
        })
      }
    } catch (err: any) {
      onError(err.message || 'An unexpected error occurred')
      toast({
        title: "Error",
        description: err.message || 'An unexpected error occurred',
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          {type === 'authorization' ? 'Card Authorization' : 'Payment Details'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {type === 'authorization' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                We'll authorize €{amount} on your card. This is not a charge - 
                you'll pay the full amount at the property.
              </AlertDescription>
            </Alert>
          )}

          <PaymentElement 
            options={{
              layout: 'tabs'
            }}
          />

          <div className="flex flex-col gap-3">
            <div className="text-sm text-gray-600">
              <strong>Amount: €{amount.toFixed(2)}</strong>
              {type === 'authorization' && (
                <span className="block text-xs text-gray-500 mt-1">
                  Authorization only - not a charge
                </span>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={!stripe || processing || isProcessing}
            >
              {processing || isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                type === 'authorization' ? 'Authorize Card' : `Pay €${amount.toFixed(2)}`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}