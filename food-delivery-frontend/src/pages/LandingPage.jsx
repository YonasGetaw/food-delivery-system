import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Search, MapPin, Clock, Star, Smartphone, Utensils, Truck, Shield, ArrowRight, CheckCircle, Users, TrendingUp, Award, GraduationCap, MapPinned, Wallet, Sparkles, Zap, ShieldCheck, Menu, X, PlayCircle } from 'lucide-react';
import Button from '../components/common/Button';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/student?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/student');
    }
  };

  const features = [
    {
      // Student-focused image
      img: 'https://img.icons8.com/fluency/96/graduation-cap.png',
      title: "Student-First Platform",
      description: "Designed exclusively for students with campus wide delivery and student exclusive discounts"
    },
    {
      // Campus coverage image
      img: 'https://img.icons8.com/fluency/96/marker.png',
      title: "Campus Coverage",
      description: "Complete delivery network covering all dorms, libraries, and academic buildings"
    },
    {
      // Wallet image
      img: 'https://img.icons8.com/fluency/96/wallet.png',
      title: "Budget-Friendly",
      description: "Student pricing, meal plans, and special discounts for verified students"
    },
    {
      // Smartphone image
      img: 'https://img.icons8.com/fluency/96/smartphone.png',
      title: "Smart Ordering",
      description: "AI-powered recommendations and reorder your favorite meals in one tap"
    },
    {
      // Lightning image
      img: 'https://img.icons8.com/fluency/96/flash-on.png',
      title: "Lightning Fast",
      description: "Average 20-minute delivery with real-time tracking from kitchen to your location"
    },
    {
      // Shield image
      img: 'https://img.icons8.com/fluency/96/shield.png',
      title: "Trusted & Secure",
      description: "Verified restaurants, secure payments, and 24/7 student support"
    }
  ];

  const stats = [
    { number: "200+", label: "Student Orders" },
    { number: "120+", label: "Active Students" },
    { number: "4+", label: "Restaurant Partners" },
    { number: "98%", label: "Student Satisfaction" }
  ];

  const testimonials = [
    {
      name: "Jennifer Martinez",
      role: "Computer Science, MIT",
      content: "QuickBite transformed my college experience. I can order from my favorite campus restaurants while studying in the library. The student discounts are amazing!",
      rating: 5,
      earnings: "Saved $240 this semester"
    },
    {
      name: "David Kim",
      role: "Business, Stanford",
      content: "As a student athlete, I don't have time to cook. QuickBite delivers healthy meals to the gym and my dorm. It's been a game-changer for my training schedule.",
      rating: 5,
      earnings: "500+ orders delivered"
    },
    {
      name: "Sarah Thompson",
      role: "Medicine, Johns Hopkins",
      content: "Between classes and clinical rotations, QuickBite keeps me fueled. The campus delivery is incredibly reliable and the food quality is consistently great.",
      rating: 5,
      earnings: "Used for 3 years"
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Sign Up with Student ID",
      description: "Verify your student status and unlock exclusive discounts"
    },
    {
      step: "2",
      title: "Browse & Order",
      description: "Choose from thousands of restaurants and campus favorites"
    },
    {
      step: "3",
      title: "Track & Enjoy",
      description: "Real-time tracking to your exact campus location"
    }
  ];

  const partners = [
    { name: 'Addinase Ertbe', img: '/addinas.png' },
    { name: 'Ahadu Food', img: '/ahadu.png' },
    { name: 'Crispy Ertbe', img: '/crispy.png' },
    { name: 'JBrand Food', img: '/jbrand.png' }
  ];

  const [activeStep, setActiveStep] = useState(0);

  // cycle active step every 3 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep((s) => (s + 1) % howItWorks.length);
    }, 3000);
    return () => clearInterval(id);
  }, [howItWorks.length]);

  return (
    <div className="min-h-screen bg-white">
      {/* Responsive Navigation */}
      <nav className="bg-white border-b border-[#db2777] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20 py-2">
            <div className="flex items-center">
              <span className="text-lg sm:text-2xl font-bold text-pink-600">University Food Delivery</span>
            </div>

            {/* Desktop actions */}
            <div className="hidden sm:flex items-center space-x-4" style={{ marginRight: '30px' }}>
              {isAuthenticated ? (
                  <Button variant="primary" onClick={() => navigate('/student')} className="bg-[#db2777] hover:bg-[#9f1239] px-4 py-2 text-sm">
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/auth/login')}
                    className="bg-gray-300 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm px-4 py-2 rounded-full"
                  >
                    Log in
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => navigate('/auth/register')}
                    className="bg-[#92194c] hover:bg-[#721650] text-white text-sm px-4 py-2 sm:mr-[30px] rounded-[6px]"
                  >
                    Sign up
                  </Button>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <div className="sm:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen((s) => !s)}
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle menu"
                className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile menu panel */}
          {mobileMenuOpen && (
            <div className="sm:hidden pb-4">
              <div className="flex flex-col space-y-3 mt-2 px-2">
                {isAuthenticated ? (
                  <Button variant="primary" onClick={() => { setMobileMenuOpen(false); navigate('/student'); }} className="w-full bg-[#db2777] hover:bg-[#9f1239] px-4 py-2">
                    Dashboard
                  </Button>
                ) : (
                  <>
                    <Button variant="secondary" onClick={() => { setMobileMenuOpen(false); navigate('/auth/login'); }} className="w-full bg-gray-300 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-[6px]">
                      Log in
                    </Button>
                    <Button variant="primary" onClick={() => { setMobileMenuOpen(false); navigate('/auth/register'); }} className="w-full bg-[#be185d] hover:bg-[#7f1d5b] text-white px-4 py-2 rounded-[6px]">
                      Sign up
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-pink-50 to-white py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Image - collapses above content on mobile */}
            <div className="order-1 lg:order-1">
              <div className="w-full rounded-b-[5px] overflow-hidden h-56 sm:h-72 md:h-96">
                <img
                  src="/shaffe.png"
                  alt="Delicious cookies and food - Photo by Valentin Zickner on Unsplash"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Content */}
            <div className="order-2 lg:order-2">
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                University Food Delivery System
                <br />
                <span className="text-pink-600">works for students</span>
              </h1>
              <p className="text-md sm:text-lg text-gray-600 mb-6 leading-relaxed">
                The only food delivery platform built for student life. Campus wide delivery,
                student exclusive pricing, and your favorite local restaurants — all designed around your schedule.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/auth/register')}
                  className="w-full sm:w-auto bg-[#9f2156] hover:bg-[#a40e39] text-white px-6 py-3 text-base font-semibold sm:mr-[30px] rounded-[6px]"
                >
                  Order Food
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate('/student')}
                  className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 text-base font-semibold"
                >
                  Browse Restaurants
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 sm:py-12 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <p className="text-sm font-medium text-black">TRUSTED BY CAFE AND RESTAURANTS</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 items-center text-center">
            {partners.map((p, index) => (
              <div key={index} className="text-center flex flex-col items-center">
                <div className="w-full flex items-center justify-center mb-2">
                  <img
                    src={p.img}
                    alt={`${p.name} logo`}
                    className="h-16 object-contain"
                  />
                </div>
                <div className="text-sm font-semibold text-gray-700">{p.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 sm:py-16 bg-[#f8f9fa]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm flex flex-col items-center justify-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-pink-600 mb-1">
                  {stat.number}
                </div>
                <div className="text-sm sm:text-base text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Two Column with Video + Process */}
      <section className="py-10 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              How University Food Delivery Works
            </h2>
            <p className="text-md sm:text-lg text-gray-600 max-w-3xl mx-auto">
              Real steps and a quick demo to show how ordering and delivery works on campus
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left: Demo video */}
            <div className="w-full">
              <div className="rounded-lg overflow-hidden shadow-lg bg-gray-50">
                <video
                  src="https://www.w3schools.com/html/mov_bbb.mp4"
                  controls
                  muted
                  loop
                  playsInline
                  className="w-full h-64 sm:h-80 md:h-96 object-cover"
                />
                {/* ? */}
              </div>
            </div>

            {/* Right: Real process steps */}
            <div className="w-full min-h-[24rem] flex items-center">
              <div className="w-full">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-1">
                  {howItWorks.map((step, index) => {
                    const isActive = activeStep === index;
                    return (
                      <div key={index} className={`flex items-start space-x-4 p-6 rounded-lg transition-colors ${isActive ? 'bg-white shadow-md' : 'bg-gray-50'}`}>
                        <div className="flex-shrink-0">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${isActive ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                            {step.step}
                          </div>
                        </div>
                        <div>
                          <h3 className={`text-xl sm:text-2xl font-semibold ${isActive ? 'text-pink-600' : 'text-gray-700'}`}>{step.title}</h3>
                          <p className="text-sm text-gray-600">{step.description}</p>
                          <div className={`mt-2 flex items-center text-sm ${isActive ? 'text-pink-600' : 'text-gray-500'}`}>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-10 sm:py-20 bg-[#f8f9fa]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Students Choose University Food Delivery
            </h2>
            <p className="text-md sm:text-lg text-gray-600 max-w-3xl mx-auto">
              Built specifically for student life with features that matter most to you
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg p-6 sm:p-8 border border-gray-200">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center">
                    <img src={feature.img} alt={feature.title} className="w-10 h-10 object-contain" />
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 text-center">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 text-center leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#323232] text-white py-8 sm:py-16 m-4 sm:m-5 rounded-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <span className="text-xl sm:text-2xl text-pink-600 font-bold">University Food Delivery</span>
              </div>
              <p className="text-sm sm:text-base text-white mb-4 leading-relaxed">
                The leading food delivery platform designed exclusively for students.
                We're making campus dining better, one delivery at a time.
              </p>
              <div className="flex space-x-3">
                <a href="#" aria-label="Facebook" className="w-9 h-9 bg-[#be185d] text-white rounded-full flex items-center justify-center hover:bg-white hover:text-[#1877F2] cursor-pointer transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 10-11.5 9.9v-7h-2.1v-2.9h2.1V9.4c0-2.1 1.3-3.3 3.2-3.3.9 0 1.9.2 1.9.2v2.1h-1.1c-1.1 0-1.4.7-1.4 1.4v1.6h2.4l-.4 2.9h-2V22A10 10 0 0022 12z"/></svg>
                </a>
                <a href="#" aria-label="Twitter" className="w-9 h-9 bg-[#be185d] text-white rounded-full flex items-center justify-center hover:bg-white hover:text-[#1DA1F2] cursor-pointer transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 5.8c-.6.3-1.2.5-1.9.6.7-.4 1.2-1 1.4-1.8-.7.4-1.5.7-2.4.9A4 4 0 0012 8v.5A11.3 11.3 0 013 4.8a4 4 0 001.2 5.3c-.5 0-1-.1-1.5-.4v.1c0 1.9 1.3 3.6 3.2 4-.4.1-.8.2-1.3.2-.3 0-.6 0-.9-.1.6 1.9 2.4 3.2 4.5 3.2A8.1 8.1 0 012 19.5a11.5 11.5 0 006.3 1.8c7.5 0 11.6-6.2 11.6-11.6v-.5c.8-.6 1.5-1.3 2.1-2.1-.7.3-1.4.5-2.1.6z"/></svg>
                </a>
                <a href="#" aria-label="LinkedIn" className="w-9 h-9 bg-[#be185d] text-white rounded-full flex items-center justify-center hover:bg-white hover:text-[#0A66C2] cursor-pointer transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM3 9h4v12H3zM9 9h3.9v1.6h.1c.5-.9 1.6-1.9 3.4-1.9C19.6 8.6 21 10 21 13.3V21h-4v-6.1c0-1.5 0-3.4-2.1-3.4-2.1 0-2.4 1.6-2.4 3.3V21H9z"/></svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">For Students</h3>
              <ul className="space-y-2">
                <li><Link to="/student" className="text-white block hover:text-gray-300 transition-colors">Order Food</Link></li>
                <li><Link to="/student" className="text-white block hover:text-gray-300 transition-colors">Student Deals</Link></li>
                <li><a href="#" className="text-white block hover:text-gray-300 transition-colors">Campus Map</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Partners</h3>
              <ul className="space-y-2">
                <li><Link to="/auth/register" className="text-gray-300 block hover:text-white transition-colors">Add Restaurant</Link></li>
                <li><Link to="/auth/register" className="text-gray-300 block hover:text-white transition-colors">Become Rider</Link></li>
                <li><a href="#" className="text-gray-300 block hover:text-white transition-colors">Partner Portal</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 block hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-300 block hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-300 block hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#be185d] mt-8 pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <p className="text-gray-300 text-sm mb-4 sm:mb-0">
                © 2024 University Food Delivery Technologies Inc. All rights reserved.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-300 text-sm hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-300 text-sm hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="text-gray-300 text-sm hover:text-white transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;