import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Star, ArrowRight, MessageSquare, Store, Award, CheckCircle } from 'lucide-react';
import ReviewSlider from '../components/ReviewSlider';
import BoltBadge from '../components/BoltBadge';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Search,
      title: 'AI-Powered Search',
      description: 'Find exactly what you need with our intelligent product matching system'
    },
    {
      icon: Users,
      title: 'University Network',
      description: 'Connect with verified sellers from your university community'
    },
    {
      icon: Star,
      title: 'Trusted Reviews',
      description: 'Make informed decisions with authentic ratings and reviews'
    },
    {
      icon: MessageSquare,
      title: 'Direct Communication',
      description: 'Chat directly with sellers via WhatsApp for instant responses'
    }
  ];

  const stats = [
    { number: '500+', label: 'Active Sellers' },
    { number: '2', label: 'Universities' },
    { number: '1000+', label: 'Products Found' },
    { number: '4.8', label: 'Average Rating' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">
                <span className="text-orange-500">uni</span>
                <span className="text-blue-800">store.</span>
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How it Works</a>
              <button
                onClick={() => navigate('/sellers')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Browse Sellers
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2 rounded-full font-medium transition-all duration-200"
              >
                Start Shopping
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Your University
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-blue-600">
                  Marketplace
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Connect with verified sellers from your university. Find everything you need with AI-powered search and direct WhatsApp communication.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/')}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Start Shopping Now
                </button>
                <button
                  onClick={() => navigate('/sellers')}
                  className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:bg-gray-50"
                >
                  Browse Sellers
                </button>
              </div>
            </div>
            
            {/* Hero Illustration */}
            <div className="relative">
              <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                      JD
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">John Doe</h3>
                      <p className="text-sm text-gray-600">Bingham University</p>
                    </div>
                    <div className="ml-auto">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">Electronics</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">Books</span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">Accessories</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">(24 reviews)</span>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-blue-500 rounded-3xl blur-xl opacity-20 transform scale-105"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose UniStore?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We've built the perfect platform to connect university students with trusted local sellers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm border hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white mb-6">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get what you need in just a few simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Search for Products</h3>
              <p className="text-gray-600">
                Tell us what you're looking for and our AI will find the best matches from your university
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Connect with Sellers</h3>
              <p className="text-gray-600">
                Browse verified sellers and contact them directly via WhatsApp for instant communication
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Complete Your Purchase</h3>
              <p className="text-gray-600">
                Arrange pickup or delivery and leave a review to help other students
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ReviewSlider />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-500 via-orange-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Start Shopping?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Join thousands of students who trust UniStore for their university shopping needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="bg-white text-orange-600 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Start Shopping
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/sellers')}
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:bg-white hover:text-orange-600"
            >
              Browse Sellers
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">
                <span className="text-orange-500">uni</span>
                <span className="text-blue-400">store.</span>
              </h3>
              <p className="text-gray-400 mb-4 max-w-md">
                Connecting university students with trusted local sellers through AI-powered search and direct communication.
              </p>
              <BoltBadge variant="footer" className="mb-4" />
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => navigate('/')} className="hover:text-white transition-colors">Search Products</button></li>
                <li><button onClick={() => navigate('/sellers')} className="hover:text-white transition-colors">Browse Sellers</button></li>
                <li><button onClick={() => navigate('/past-requests')} className="hover:text-white transition-colors">Past Requests</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Universities</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Bingham University</li>
                <li>Veritas University</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 UniStore. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}