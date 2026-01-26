import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Eye, Database, Trash2, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
  const lastUpdated = "January 26, 2026";

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-navy">Privacy Policy</h1>
          </div>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-navy max-w-none space-y-8">
          {/* Introduction */}
          <section className="bg-card rounded-2xl border border-border p-6">
            <h2 className="text-xl font-semibold text-navy mb-4">Our Commitment to Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              At UAE Tour Planner, we take your privacy seriously. This privacy policy explains how we handle your data when you use our travel planning service. We believe in transparency and giving you control over your information.
            </p>
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-800 text-sm">
                <strong>Good news:</strong> Your data never leaves your device. We don't collect, store, or process any personal information on our servers.
              </p>
            </div>
          </section>

          {/* Data Collection */}
          <section className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-navy">What Data We Collect</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-foreground mb-2">Trip Planning Data (Stored Locally)</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Travel destinations and preferences</li>
                  <li>• Trip dates and duration</li>
                  <li>• Number of travelers</li>
                  <li>• Budget preferences</li>
                  <li>• Activity interests and preferences</li>
                  <li>• Generated itineraries and saved trips</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-blue-800 text-sm">
                  <strong>Important:</strong> All this data is stored only in your browser's localStorage and never transmitted to our servers.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">Technical Data (Minimal)</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Browser type and version (for compatibility)</li>
                  <li>• Screen resolution (for responsive design)</li>
                  <li>• Language preference</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Data */}
          <section className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-navy">How We Use Your Data</h2>
            </div>
            
            <div className="space-y-3 text-muted-foreground">
              <p>Your data is used exclusively for:</p>
              <ul className="space-y-2 ml-4">
                <li>• Generating personalized travel itineraries</li>
                <li>• Saving your trip preferences for future use</li>
                <li>• Providing a seamless user experience</li>
                <li>• Maintaining your trip data between sessions</li>
              </ul>
              
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-yellow-800 text-sm">
                  <strong>Never:</strong> We never sell, share, or use your data for advertising, marketing, or any purpose other than providing our travel planning service.
                </p>
              </div>
            </div>
          </section>

          {/* Data Storage */}
          <section className="bg-card rounded-2xl border border-border p-6">
            <h2 className="text-xl font-semibold text-navy mb-4">Where Your Data is Stored</h2>
            
            <div className="space-y-4 text-muted-foreground">
              <div className="p-4 bg-muted rounded-xl">
                <h3 className="font-medium text-foreground mb-2">localStorage Only</h3>
                <p>All your trip data is stored exclusively in your web browser's localStorage, which means:</p>
                <ul className="mt-2 space-y-1 ml-4">
                  <li>• Data stays on your device</li>
                  <li>• We have no access to it</li>
                  <li>• It's not backed up to cloud servers</li>
                  <li>• Clearing browser data will remove your trips</li>
                </ul>
              </div>
              
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-800 text-sm">
                  <strong>Warning:</strong> If you clear your browser data or use a different browser/device, your saved trips will be lost. We recommend exporting important itineraries as PDFs.
                </p>
              </div>
            </div>
          </section>

          {/* Data Control */}
          <section className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-navy">Your Data Control Rights</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-foreground mb-2">You have complete control over your data:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• <strong>Access:</strong> View all your saved trips anytime</li>
                  <li>• <strong>Edit:</strong> Modify your trip details and preferences</li>
                  <li>• <strong>Delete:</strong> Remove individual trips or all data</li>
                  <li>• <strong>Export:</strong> Download your itineraries as PDFs (Pro feature)</li>
                  <li>• <strong>Clear:</strong> Remove all data by clearing browser storage</li>
                </ul>
              </div>

              <div className="p-4 bg-muted rounded-xl">
                <h4 className="font-medium text-foreground mb-2">How to Delete Your Data:</h4>
                <ol className="space-y-1 text-sm text-muted-foreground">
                  <li>1. Go to your browser settings</li>
                  <li>2. Find "Privacy and security"</li>
                  <li>3. Click "Clear browsing data"</li>
                  <li>4. Select "Site data" or "Cookies and site data"</li>
                  <li>5. Clear data for this website</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Third-Party Services */}
          <section className="bg-card rounded-2xl border border-border p-6">
            <h2 className="text-xl font-semibold text-navy mb-4">Third-Party Services</h2>
            
            <div className="space-y-3 text-muted-foreground">
              <p>We use minimal third-party services:</p>
              <ul className="space-y-2 ml-4">
                <li>• <strong>Google Maps:</strong> For location services (opened in new tabs)</li>
                <li>• <strong>Payment Processor:</strong> For Pro upgrades (when implemented)</li>
              </ul>
              
              <p className="text-sm">These services have their own privacy policies and we don't control their data practices.</p>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-navy">Contact Us</h2>
            </div>
            
            <div className="space-y-3 text-muted-foreground">
              <p>If you have questions about this privacy policy or how we handle your data:</p>
              <div className="p-4 bg-muted rounded-xl">
                <p><strong>Email:</strong> privacy@uaetourplanner.com</p>
                <p><strong>Response Time:</strong> We'll respond within 48 hours</p>
              </div>
            </div>
          </section>

          {/* Policy Updates */}
          <section className="bg-card rounded-2xl border border-border p-6">
            <h2 className="text-xl font-semibold text-navy mb-4">Policy Updates</h2>
            
            <div className="space-y-3 text-muted-foreground">
              <p>We may update this privacy policy occasionally. When we do, we will:</p>
              <ul className="space-y-2 ml-4">
                <li>• Update the "Last updated" date</li>
                <li>• Post a notice on our website</li>
                <li>• Notify users of significant changes</li>
              </ul>
              
              <p className="text-sm">Continued use of our service after changes means you accept the updated policy.</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2026 UAE Tour Planner. Your privacy is our priority.</p>
        </div>
      </div>
    </div>
  );
}
