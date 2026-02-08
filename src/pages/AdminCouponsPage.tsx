import { useState, useEffect } from 'react';
import { supabase, Coupon, School, HostelsProductUpdates } from '../lib/supabase';
import { Toaster, toast } from 'sonner';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

    // Product Selector State
    const [products, setProducts] = useState<HostelsProductUpdates[]>([]);
    const [showProductSelector, setShowProductSelector] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        value: '',
        school_id: '',
        type: 'discount' as 'discount' | 'product',
        product_id: '',
        claimed: false
    });

    const navigate = useNavigate();

    useEffect(() => {
        checkAdmin();
        fetchSchools();
    }, []);

    useEffect(() => {
        if (schools.length > 0) {
            fetchCoupons();
        }
    }, [schools]);

    const checkAdmin = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            navigate('/');
            return;
        }
        // Check if admin
        const { data } = await supabase.from('unique_visitors').select('is_admin').eq('auth_user_id', session.user.id).single();
        if (!data?.is_admin) {
            toast.error('Unauthorized');
            navigate('/');
        }
    };

    const fetchSchools = async () => {
        const { data } = await supabase.from('schools').select('*').order('name');
        if (data) setSchools(data);
    };

    const fetchCoupons = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('coupons')
            .select(`
                *,
                schools (name)
            `)
            .order('created_at', { ascending: false });

        if (error) toast.error('Error fetching coupons');
        if (data) setCoupons(data as any); // Cast for join
        setLoading(false);
    };

    const fetchProducts = async (schoolId: string) => {
        setProducts([]); // Clear previous
        setLoadingProducts(true);
        // Join unique_visitors to filter by school_id
        const { data, error } = await supabase
            .from('hostel_product_updates')
            .select('*, unique_visitors!inner(school_id)')
            .eq('unique_visitors.school_id', schoolId)
            .eq('post_type', 'update')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) toast.error('Error fetching products');
        if (data) setProducts(data as any);
        setLoadingProducts(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                code: formData.code.toUpperCase(),
                value: Number(formData.value) || 0,
                school_id: formData.school_id,
                type: formData.type,
                product_id: formData.product_id || null, // null if empty
                claimed: formData.claimed
            };

            if (editingCoupon) {
                const { error } = await supabase
                    .from('coupons')
                    .update(payload)
                    .eq('id', editingCoupon.id);
                if (error) throw error;
                toast.success('Coupon updated');
            } else {
                const { error } = await supabase
                    .from('coupons')
                    .insert([payload]);
                if (error) throw error;
                toast.success('Coupon created');
            }
            setShowModal(false);
            setEditingCoupon(null);
            resetForm();
            fetchCoupons();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        const { error } = await supabase.from('coupons').delete().eq('id', id);
        if (error) toast.error('Error deleting');
        else {
            toast.success('Deleted');
            fetchCoupons();
        }
    };

    const openEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            value: String(coupon.value),
            school_id: coupon.school_id,
            type: coupon.type || 'discount',
            product_id: coupon.product_id || '',
            claimed: coupon.claimed
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            code: '',
            value: '',
            school_id: schools[0]?.id || '',
            type: 'discount',
            product_id: '',
            claimed: false
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <Toaster position="top-center" />

            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Manage Coupons</h1>
                    <div className="flex gap-2">
                        <button onClick={() => navigate('/')} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            Back
                        </button>
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700"
                        >
                            <Icon icon="vuesax:linear:add" width="20" height="20" /> New Coupon
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20">Loading...</div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-50 text-gray-900 font-semibold border-b">
                                    <tr>
                                        <th className="p-4">Code</th>
                                        <th className="p-4">Value</th>
                                        <th className="p-4">Type</th>
                                        <th className="p-4">School</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {coupons.map(coupon => (
                                        <tr key={coupon.id} className="hover:bg-gray-50">
                                            <td className="p-4 font-mono font-bold text-emerald-600">{coupon.code}</td>
                                            <td className="p-4">
                                                {coupon.type === 'product' ? (
                                                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">FREE ITEM</span>
                                                ) : (
                                                    `₦${coupon.value.toLocaleString()}`
                                                )}
                                            </td>
                                            <td className="p-4 capitalize">{coupon.type}</td>
                                            <td className="p-4">{(coupon as any).schools?.name || 'N/A'}</td>
                                            <td className="p-4">
                                                {coupon.claimed ? (
                                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">Claimed</span>
                                                ) : (
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Active</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <button onClick={() => openEdit(coupon)} className="text-blue-600 hover:bg-blue-50 p-2 rounded">
                                                    <Icon icon="vuesax:linear:edit" width="16" height="16" />
                                                </button>
                                                <button onClick={() => handleDelete(coupon.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">
                                                    <Icon icon="vuesax:linear:trash" width="16" height="16" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Product Selector Modal */}
            {showProductSelector && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg h-[80vh] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg">Select Product</h3>
                            <button onClick={() => setShowProductSelector(false)} className="p-1 hover:bg-gray-100 rounded-full">
                                <Icon icon="vuesax:linear:close-circle" width="20" height="20" className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-2 border-b bg-gray-50">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full p-2 border rounded-lg text-sm outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {loadingProducts ? (
                                <div className="text-center py-10 text-gray-500">Loading products...</div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {products
                                        .filter(p => p.post_description.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map(product => (
                                            <div
                                                key={product.id}
                                                onClick={() => {
                                                    setFormData({ ...formData, product_id: product.id });
                                                    setShowProductSelector(false);
                                                }}
                                                className={`
                                                relative border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md
                                                ${formData.product_id === product.id ? 'ring-2 ring-emerald-500 bg-emerald-50' : 'bg-white'}
                                            `}
                                            >
                                                {/* Image/Video Thumbnail */}
                                                <div className="h-24 w-full bg-gray-200 relative">
                                                    {product.post_images && product.post_images.length > 0 ? (
                                                        <img
                                                            src={product.post_images[0]}
                                                            alt="Product"
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                            <Icon icon="vuesax:linear:gallery" width="24" height="24" />
                                                        </div>
                                                    )}
                                                    {formData.product_id === product.id && (
                                                        <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                                            <div className="bg-white rounded-full p-1 shadow-sm">
                                                                <Icon icon="vuesax:linear:tick-circle" width="16" height="16" className="text-emerald-600" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="p-2">
                                                    <p className="text-xs text-gray-800 font-medium line-clamp-2 h-8 leading-tight mb-1">
                                                        {product.post_description}
                                                    </p>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <span className="text-xs font-bold text-gray-500">
                                                            {product.price ? `₦${Number(product.price).toLocaleString()}` : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    {products.length === 0 && (
                                        <div className="col-span-full text-center py-10 text-gray-400 text-sm">
                                            No products found.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">{editingCoupon ? 'Edit Coupon' : 'New Coupon'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <Icon icon="vuesax:linear:close-circle" width="24" height="24" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                                <select
                                    required
                                    value={formData.school_id}
                                    onChange={e => {
                                        setFormData({ ...formData, school_id: e.target.value, product_id: '' }); // Clear product if school changes
                                        setProducts([]); // Clear cached products
                                    }}
                                    className="w-full border rounded-lg p-2 outline-none"
                                >
                                    <option value="">Select School</option>
                                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-mono"
                                    placeholder="e.g. SAVE2025"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full border rounded-lg p-2 outline-none"
                                    >
                                        <option value="discount">Discount (₦)</option>
                                        <option value="product">Product (Free)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Value (₦) {formData.type === 'product' && <span className="text-gray-400 font-normal">(Optional)</span>}
                                    </label>
                                    <input
                                        required={formData.type !== 'product'}
                                        type="number"
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: e.target.value })}
                                        className="w-full border rounded-lg p-2 outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {formData.type === 'product' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <input
                                                readOnly
                                                type="text"
                                                value={formData.product_id}
                                                className={`w-full border rounded-lg p-2 pl-8 text-sm outline-none cursor-pointer ${!formData.school_id ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50'}`}
                                                placeholder={formData.school_id ? "Select a product..." : "Select school first"}
                                                onClick={() => {
                                                    if (!formData.school_id) return toast.error('Please select a school first');
                                                    setShowProductSelector(true);
                                                    fetchProducts(formData.school_id);
                                                }}
                                            />
                                            <Icon icon="vuesax:linear:gift" className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!formData.school_id) return toast.error('Please select a school first');
                                                setShowProductSelector(true);
                                                fetchProducts(formData.school_id);
                                            }}
                                            className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={!formData.school_id}
                                        >
                                            <Icon icon="vuesax:linear:search-normal" width="18" height="18" />
                                        </button>
                                    </div>
                                    {formData.product_id && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, product_id: '' })}
                                            className="text-xs text-red-500 mt-1 hover:underline"
                                        >
                                            Remove linked product
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="claimed"
                                    checked={formData.claimed}
                                    onChange={e => setFormData({ ...formData, claimed: e.target.checked })}
                                    className="w-4 h-4 text-emerald-600 rounded"
                                />
                                <label htmlFor="claimed" className="text-sm text-gray-700">Mark as Claimed</label>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700 mt-4"
                            >
                                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
