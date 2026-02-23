import { Link } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { usersAPI } from '../../api/users';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import ChangePasswordModal from '../../components/common/ChangePasswordModal';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getAssetUrl } from '../../utils/helpers';

const AdminProfile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await usersAPI.getProfile();
      const p = res.data || res;
      setProfile(p);
      setForm({
        first_name: p.first_name || '',
        last_name: p.last_name || '',
        phone: p.phone || '',
      });
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const displayName = useMemo(() => {
    const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    return name || user?.email || '';
  }, [user]);

  const initial = (user?.firstName || user?.email || 'U').trim().charAt(0).toUpperCase();
  const avatarSrc = profile?.profile_image_url ? getAssetUrl(profile.profile_image_url) : '';

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await usersAPI.uploadProfileImage(fd);
      const data = res.data || res;
      const imageUrl = data.image_url;
      toast.success('Profile image updated');
      setProfile((prev) => ({ ...(prev || {}), profile_image_url: imageUrl }));
      updateUser({ profileImageUrl: imageUrl });
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await usersAPI.updateProfile(form);
      toast.success('Profile updated');
      updateUser({
        firstName: form.first_name,
        lastName: form.last_name,
        phone: form.phone,
      });
      await loadProfile();
    } catch (err) {
      toast.error(err?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin" className="text-sm font-semibold text-[#db2777] hover:underline">
          Home
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-[#db2777] text-white flex items-center justify-center text-3xl font-bold overflow-hidden">
            {avatarSrc ? <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" /> : <span>{initial}</span>}
          </div>
          <div className="min-w-[220px]">
            <div className="font-semibold text-gray-900 dark:text-gray-100">{displayName}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">{profile?.phone || ''}</div>
          </div>

          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files?.[0])}
              disabled={uploading}
            />
            <Button
              variant="primary"
              disabled={uploading}
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Image
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Account Details</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={form.first_name}
              onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
              required
            />
            <Input
              label="Last Name"
              value={form.last_name}
              onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
              required
            />
          </div>
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            required
          />
          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Security</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">Update your password</p>
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="primary" onClick={() => setChangePasswordOpen(true)}>
            Change Password
          </Button>
        </div>
      </div>

      <ChangePasswordModal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </div>
  );
};

export default AdminProfile;
