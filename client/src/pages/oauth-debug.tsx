import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function OAuthDebug() {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const testGoogleAuth = async () => {
    setStatus('testing');
    setMessage('Testing Google OAuth endpoint...');
    
    try {
      const response = await fetch('/api/auth/google', {
        method: 'GET',
        redirect: 'manual' // Don't follow redirects
      });
      
      if (response.type === 'opaqueredirect' || response.status === 0) {
        setStatus('success');
        setMessage('✅ Google OAuth is working! Redirecting to Google...');
        return;
      }
      
      if (response.status === 302) {
        const location = response.headers.get('Location');
        if (location?.includes('accounts.google.com')) {
          setStatus('success');
          setMessage('✅ Google OAuth is working! Redirect URL: ' + location);
        } else {
          setStatus('error');
          setMessage('❌ Unexpected redirect: ' + location);
        }
      } else if (response.status === 503) {
        const data = await response.json();
        setStatus('error');
        setMessage('❌ ' + data.error);
      } else {
        setStatus('error');
        setMessage('❌ Unexpected response: ' + response.status);
      }
    } catch (error) {
      setStatus('error');
      setMessage('❌ Error: ' + (error as Error).message);
    }
  };

  const openGoogleConsole = () => {
    window.open('https://console.cloud.google.com/apis/credentials', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Google OAuth Debug Panel</h1>
        
        <div className="grid gap-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {status === 'idle' && <AlertCircle className="w-5 h-5 text-gray-500" />}
                {status === 'testing' && <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
                {status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                {status === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
                OAuth Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={testGoogleAuth}
                  disabled={status === 'testing'}
                  className="w-full"
                >
                  {status === 'testing' ? 'Testing...' : 'Test Google OAuth'}
                </Button>
                
                {message && (
                  <div className={`p-4 rounded-lg ${
                    status === 'success' ? 'bg-green-50 text-green-800' : 
                    status === 'error' ? 'bg-red-50 text-red-800' : 
                    'bg-blue-50 text-blue-800'
                  }`}>
                    <pre className="whitespace-pre-wrap text-sm">{message}</pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Setup Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Current Status:</strong> Using test credentials that won't work with real Google OAuth.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold">To fix this:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      <Button 
                        onClick={openGoogleConsole}
                        variant="outline"
                        size="sm"
                        className="ml-2"
                      >
                        Open Google Cloud Console
                      </Button>
                    </li>
                    <li>Create a new project or select an existing one</li>
                    <li>Enable the Google+ API or People API</li>
                    <li>Go to Credentials → Create Credentials → OAuth 2.0 Client ID</li>
                    <li>Configure consent screen if prompted</li>
                    <li>For Application type, select "Web application"</li>
                    <li>Add authorized redirect URI: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:3000/api/auth/google/callback</code></li>
                    <li>Copy the Client ID and Client Secret</li>
                    <li>Update your .env file with the real credentials</li>
                    <li>Restart the server</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Config */}
          <Card>
            <CardHeader>
              <CardTitle>Current Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Client ID (from .env)</Label>
                  <Input 
                    value="test-client-id (this is a placeholder)"
                    readOnly
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Callback URL</Label>
                  <Input 
                    value="http://localhost:3000/api/auth/google/callback"
                    readOnly
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Test Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Test Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  onClick={() => window.location.href = '/api/auth/google'}
                  variant="outline"
                  className="w-full"
                >
                  Try Google OAuth (will fail with test credentials)
                </Button>
                <Button 
                  onClick={() => window.location.href = '/login'}
                  variant="outline"
                  className="w-full"
                >
                  Go to Login Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
