import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Menu, X } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    student_id: '',
    phone: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.first_name.trim()) {
      setError('First name is required');
      return;
    }
    if (!formData.last_name.trim()) {
      setError('Last name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!formData.student_id.trim()) {
      setError('Student ID is required');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        student_id: formData.student_id,
        phone: formData.phone,
        password: formData.password,
      });
      navigate('/student');
    } catch (err) {
      setError(err.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar (copied from LandingPage) */}
      <nav className="bg-white border-b border-[#db2777] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20 py-2">
            <div className="flex items-center">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-lg sm:text-2xl font-bold text-pink-600">University Food Delivery</Link>
            </div>

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
                    className="bg-[#af1354] hover:bg-[#7a1a57] text-white text-sm px-4 py-2 rounded-[6px]"
                  >
                    Sign up
                  </Button>
                </>
              )}
            </div>

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

      {/* Main content: keep original centered form */}
      <main className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
                placeholder="John"
              />

              <Input
                label="Last Name"
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
                placeholder="Doe"
              />
            </div>

            <Input
              label="Student Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="student@university.edu"
            />

            <Input
              label="Student ID"
              type="text"
              name="student_id"
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              required
              placeholder="Enter your student ID"
            />

            <Input
              label="Phone Number"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9+\-\(\)\s]/g, '');
                setFormData({ ...formData, phone: value });
              }}
              required
              placeholder="0912120000"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Minimum 6 characters"
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
              required
              placeholder="Re-enter your password"
            />

            <Button type="submit" variant="primary" size="lg" className="w-full bg-[#dc2678] hover:bg-[#ad133e]" loading={loading}>
              Create Account
            </Button>

            <div className="text-center"> 
              <Link to="/auth/login" className="text-green-900 hover:text-[#17660c]">
                Already have an account? Sign in here
              </Link>
            </div>
          </form>
        </div>
      </main>

      {/* Footer (copied from LandingPage) */}
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

export default RegisterPage;
