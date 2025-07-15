import React from 'react';
// import { Button } from '@/components/ui/button';
import { MessageCircle, Cloud, Users, Shield, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background clouds */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/20 rounded-full blur-xl animate-float" />
        <div className="absolute top-40 right-32 w-24 h-24 bg-blue-200/30 rounded-full blur-lg animate-float-slow" />
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-purple-200/20 rounded-full blur-2xl animate-float-slower" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-white/30 backdrop-blur-lg rounded-full p-6 shadow-lg border border-white/40">
              <MessageCircle className="w-12 h-12 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-800 mb-4">Anonymous Chat</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with others in a safe, anonymous environment. Share your thoughts freely without judgment.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/25 backdrop-blur-xl rounded-xl p-6 text-center border border-white/30 transition duration-300 cursor-pointer hover:scale-102 hover:shadow-xl">
            <Users className="w-10 h-10 text-indigo-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Connect Freely</h3>
            <p className="text-gray-600">Meet new people and have genuine conversations without revealing your identity.</p>
          </div>
          
          <div className="bg-white/25 backdrop-blur-xl rounded-xl p-6 text-center border border-white/30 transition duration-300 cursor-pointer hover:scale-102 hover:shadow-xl">
            <Shield className="w-10 h-10 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Privacy First</h3>
            <p className="text-gray-600">Your conversations are encrypted and anonymous. No personal data is stored.</p>
          </div>
          
          <div className="bg-white/25 backdrop-blur-xl rounded-xl p-6 text-center border border-white/30 transition duration-300 cursor-pointer hover:scale-102 hover:shadow-xl">
            <Heart className="w-10 h-10 text-pink-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Safe Space</h3>
            <p className="text-gray-600">Express yourself authentically in a judgment-free environment.</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-8 max-w-md mx-auto border border-white/40">
            <Cloud className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-cloud-float" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to Chat?</h2>
            <p className="text-gray-600 mb-6">Join thousands of users having meaningful conversations in the cloud.</p>
            <Link
              to="/login"
              className="block w-full rounded-lg bg-gradient-to-r from-indigo-400 to-purple-500 text-white font-semibold py-3 text-lg shadow hover:from-indigo-500 hover:to-purple-600 transition text-center"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes cloud-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-24px); }
        }
        .animate-cloud-float {
          animation: cloud-float 3.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Index;
