import React, { useState } from 'react';
import { V2Layout } from '../../components/v2/V2Layout';
import { ProductDetailSheetV2 } from '../../components/v2/ProductDetailSheetV2';
import { LiveRequestResponseSheetV2 } from '../../components/v2/LiveRequestResponseSheetV2';

export const HostelHomePageV2: React.FC = () => {
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isRequestOpen, setIsRequestOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);

    const openProductDetail = (product: any) => {
        setSelectedProduct(product);
        setIsDetailOpen(true);
    };

    const openRequestResponse = (request: any) => {
        setSelectedRequest(request);
        setIsRequestOpen(true);
    };

    return (
        <V2Layout activeTab="home">
            {/* Safety Banner */}
            <section className="p-4 pt-6">
                <div className="relative overflow-hidden bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 rounded-[2rem] p-5 flex gap-5 items-center shadow-sm backdrop-blur-3xl group">
                    <div className="absolute -right-8 -top-8 text-primary/5 transform rotate-12 group-hover:rotate-0 transition-transform duration-700">
                        <span className="material-symbols-outlined text-8xl">verified_user</span>
                    </div>
                    <div className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/20 z-10">
                        <span className="material-symbols-outlined text-2xl">shield_lock</span>
                    </div>
                    <div className="flex-1 z-10">
                        <h4 className="text-sm font-bold dark:text-white mb-0.5 tracking-wide">Safe Payment Priority</h4>
                        <p className="text-[11px] text-[#1a2a40]/60 dark:text-zinc-400 font-medium leading-relaxed">
                            Always pay through <span className="text-primary font-bold">Unistore Escrow</span> to ensure your money is safe until you receive your item.
                        </p>
                    </div>
                </div>
            </section>

            {/* Live Requests */}
            <section className="py-2">
                <div className="px-6 flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold dark:text-white tracking-tight leading-none">Live Requests</h3>
                        <div className="relative flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping absolute opacity-50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-primary relative border-2 border-white dark:border-[#221610]"></div>
                        </div>
                    </div>
                    <button className="text-primary text-xs font-bold tracking-wide hover:translate-x-1 transition-transform">See All</button>
                </div>
                <div className="flex gap-4 overflow-x-auto px-6 pb-6 no-scrollbar">
                    {[
                        { img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMjOoUnPZW3rlE8ByRPVXCV0BEp7a4Vc6ppgYNxAauuBjOWs2R-kndehOuL6Z0j7sQ6Z-95VYRi_Xi-nTsHlxBHwOKiRIjHcVRWqYI8HWNX51eIXE0pBHa20ylrzzc6W2Uc42obFZrzobl2bGpvlriOF2fn6eeI0uAiacWTbi0SaqzsCm8s_IqyaOuN1nk7X0ObHuYPiBkGqIAMyV8OQWR9kZap12cDpgcxwSRr1KKUXwxPzWwpu_Tu5f9PJlW4Ch9-fZqAE6yZDs', text: 'Who sells niacinamide serum?', time: '2 mins ago' },
                        { img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDq3JgAIfVv6gpcVbrA3Xf1m600VDl6tIO4tctCmm4ha7HNiZP9ZehUPVqFXfEe0ZV94ZG4Ep9b-yU1-LsxYnuge8Nwnm5SSZ0WA91dqZowVEK8swUyqjtjJWVQF53YAMmaDFQhhVf3DZY3l7s-0at8CgMu4hMBhX3dN0vDibXOoAosWuS5EFozeQCCnf8gMIDkMaF_qOmKOyAEn0_sRR5PPU9DowbNAGuS15fzc45NPm4OsMbxOIpArVmJVxnu4slyQDvV_TddoXE', text: 'Need small room mirrors', time: '12 mins ago' },
                        { img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVfTuWz-fOUOnYzYl9Wd4No2tbWNlDl08GmR49Zvkqe6TDJbuo8sxF66vQzf52X92kXV0Lmjly2QhUM_YX6azojuH5YG9t8gih8ESW_AwmWWElZuOtSozkJI1AMrMeheUws2aBz0MfoM2UXyInvlFrUTCq_Ro6mdfAlD4mtJ46jM1kN9PNSm_isC-CxeM7VbYZRKiXM0a3tsoMEz3PizNomWISL5lcxYYMFxVZHk7YNPb7Js_YAP71ZYyklwIQsrrsOm-tCYZjpi0', text: 'Rechargeable desk lamp', time: '25 mins ago' }
                    ].map((req, i) => (
                        <div
                            key={i}
                            onClick={() => openRequestResponse(req)}
                            className="min-w-[170px] bg-white dark:bg-white/5 p-3 rounded-[2rem] shadow-sm border border-zinc-100 dark:border-white/10 flex flex-col gap-3 cursor-pointer active:scale-95 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-2">
                                <div className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter">New</div>
                            </div>
                            <div className="w-full aspect-square rounded-[1.5rem] bg-zinc-100 dark:bg-zinc-800 overflow-hidden ring-4 ring-zinc-50 dark:ring-white/5">
                                <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src={req.img} alt="Request" />
                            </div>
                            <div className="px-1 py-1 flex flex-col gap-1.5 flex-1">
                                <p className="text-[13px] font-bold leading-snug dark:text-zinc-100 line-clamp-2">"{req.text}"</p>
                                <div className="flex items-center gap-2 mt-auto">
                                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[10px] text-primary">schedule</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{req.time}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Delicious Deals Hero */}
            <section className="px-4 py-6">
                <div className="relative w-full h-60 rounded-[2.5rem] overflow-hidden group shadow-2xl">
                    <img className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRmemFEqWFvr_bh4ieonvdlJOoznlyqLLvkmhk9zbE6yTV2jdIVrehHbHrOC_d39exKeU8Vf7lVQvM3fg3N9zlIB24NL_CTRN6gGSAvXK8ALriQZ7bQ1NCQe3bv2XjC8wgYY_jgcWb2n4_OC5pno79ZEf-Lw8DNfv_uJPA2lheTxLRcoVZ4zhufXlSgTmcLy4TfSHe4IwW47OcXR2-uSFDRbakAgjcAaSgvaTo5NAYHtHIvv456zG6LHyYbImxYoT9cF4FMz8aheA" alt="Deals" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent flex flex-col justify-end p-8">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-primary/30 tracking-widest uppercase">Hot Deal</span>
                        </div>
                        <h4 className="text-white text-3xl font-bold tracking-tight leading-none mb-1">Fresh Bread <span className="text-primary">₦350</span></h4>
                        <p className="text-white/80 text-sm font-medium tracking-wide">Zully's Bakery • Limited Stock!</p>

                        <div className="mt-4 flex gap-1.5">
                            <div className="w-10 h-1.5 bg-primary rounded-full shadow-lg shadow-primary/40"></div>
                            <div className="w-3 h-1.5 bg-white/20 rounded-full"></div>
                            <div className="w-3 h-1.5 bg-white/20 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-4">
                <div className="flex gap-8 overflow-x-auto px-8 no-scrollbar">
                    {[
                        { icon: 'restaurant', label: 'Food', active: true },
                        { icon: 'apparel', label: 'Clothing' },
                        { icon: 'devices', label: 'Gadgets' },
                        { icon: 'face_6', label: 'Beauty' },
                        { icon: 'book', label: 'Academic' }
                    ].map((cat, i) => (
                        <div key={i} className="flex flex-col items-center gap-3 shrink-0 group cursor-pointer transition-all duration-300 active:scale-95">
                            <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center transition-all duration-500 shadow-sm ${cat.active ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-110' : 'bg-white dark:bg-white/5 border border-zinc-100 dark:border-white/10 text-zinc-400 group-hover:bg-zinc-50 dark:group-hover:bg-white/10 group-hover:text-primary'}`}>
                                <span className={`material-symbols-outlined text-2xl ${cat.active ? 'fill-1 font-bold' : ''}`}>{cat.icon}</span>
                            </div>
                            <span className={`text-[10px] font-bold tracking-wider ${cat.active ? 'text-primary' : 'text-zinc-500'}`}>{cat.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Hostel Filter */}
            <section className="px-4 py-4 sticky top-14 z-40 bg-white/70 dark:bg-[#221610]/70 backdrop-blur-3xl border-b border-primary/5 transition-colors duration-500">
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    <button className="px-6 h-10 rounded-2xl bg-primary text-white text-xs font-bold tracking-wide shadow-xl shadow-primary/20 shrink-0">All Hostels</button>
                    {['CICL', 'Boys Hostel', 'New Kelson', 'Queen\'s Hall'].map((hostel, i) => (
                        <button key={i} className="px-6 h-10 rounded-2xl bg-white dark:bg-white/5 border border-zinc-100 dark:border-white/10 text-zinc-500 dark:text-zinc-400 text-xs font-bold tracking-wide shrink-0 transition-all hover:border-primary/30 hover:text-primary">
                            {hostel}
                        </button>
                    ))}
                </div>
            </section>

            {/* Product Feed */}
            <main className="p-4 grid grid-cols-2 gap-5 mb-20">
                {[
                    { name: 'Press-on Nails (Custom)', price: '2,500', oldPrice: '3,500', seller: 'GlamByZee', loc: 'Room 12B, CICL', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAiHviFKfExQVM3FUAbUBUTOO3K4r_mU7eOJPK2aNYG685Yha_7o2MJ3po5HTjY6pqLCuFcmCxVBEaZlGef7FVGwfXaXjVYDI4osMDCJL78ShItml3ZtCGN3JT_T9NxJ8t52D8OnwqBViDFoxLvJsyTwvp9NfGbeSfRdf4IB8nW6WBjesrR8QiykYu7cWZjD4vHEx_wz41USIg9PtOB99vlJnutiz37NyXHuy9ZivJL0UTa3UqTmf-B-cg9H1ziSltT2e3UTvHka8jo', description: 'Custom handmade press-on nails. Available in various sizes and shapes. Long-lasting and reusable.' },
                    { name: 'Mini Bread Loaf', price: '400', oldPrice: '600', seller: 'FoodHub', loc: 'Room 15A, New Kelson', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGyPDn5Zm2BsLp8DjK657J2VdDDqnQMJgbT5RC7s0RtekIH5GcXUZB1NfyrZTxX4zUiA8N6yW9et9CdmTooBdvRh7Mby8nc2mVgoJz-S1w5C7ERpJGhxFKjCEJ5FTK34p_x5Rxhm1OnOYWP-ZRxIRKuUy84QY-GL5L6-MHxT8f06dIP0UHmWGdNk6WO78BVMOC5U5_GF5ltsUrrXkUc7GpkNF_NqzyTL9xNw0IlCfFhZdYb9999ta8YYheHzzvN-RNVaTbBAIK12s', description: 'Freshly baked mini bread loaf. Perfect for a quick snack or breakfast.' },
                    { name: 'Bulk Protein Bars', price: '1,200', seller: 'FitnessGeek', loc: 'Boys Hostel B', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBnp5h1vMB5ETF5XUA-aDY02gAvHrupGVrr9hP9K6ap9BIA0BBggZNCrikTXJrvRmzkFARyIQ7EN10BPDMjs9j-TFz05pwzxZV1LFvQFH7AcSoNpxuF0lcVwrpqz8Eyf6LpAWOdc3RFO5ZiKyPgwXTsizznFyq2gwfSS66dSq1ckAR8e3vRML2Vgmef4LovL4_wwBAZLhH20AW15fGtVWubd1qgMCb6XP677z1FRAaUlDY9L__ZzSkcqIR9l34aZFI-hZVEIORzxiQ', description: 'High-protein bars for mass and energy. Great for gym enthusiasts.' },
                    { name: 'Portable Speaker', price: '8,500', oldPrice: '12,000', seller: 'TechBoutique', loc: 'Off-campus Area', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTKznu5BhbjDcDQAORAdLgN-zR5tZvgKluMhUt7PNryQ5eQwLMgn0xotj5z8ovNWbj-GxJn2KGcj0iBXnNdpvn9B__uRJiKvjTtU9Rt5DGU9ngm_TUNhfwG6IcJdSc0ZTJZyNnSLPCv42IAeADz0nGaHXnjWDXE0IMzDRHwbMs4djd5geWPsM4FiKjWjV8-wBHgAoBg8U7mBTTR_OLUWPG0fnmheGpPDJAOpp9zn4pptnhUctWxf4jWRAoL5ex9ymRebwd4YJ3i5c', description: 'Bluetooth portable speaker with deep bass and long battery life.' }
                ].map((product, i) => (
                    <div
                        key={i}
                        onClick={() => openProductDetail(product)}
                        className="bg-white dark:bg-white/5 rounded-[2.5rem] overflow-hidden shadow-sm border border-zinc-100 dark:border-white/10 flex flex-col group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 active:scale-95 cursor-pointer relative"
                    >
                        <div className="relative aspect-[4/5] overflow-hidden m-2 rounded-[2rem]">
                            <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={product.img} alt={product.name} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <button className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/40 dark:bg-black/40 flex items-center justify-center text-white backdrop-blur-xl shadow-lg ring-1 ring-white/20 transition-all hover:bg-primary hover:scale-110 active:scale-90 z-20">
                                <span className="material-symbols-outlined text-lg">favorite</span>
                            </button>
                        </div>
                        <div className="p-4 pt-2 flex flex-col gap-2 flex-1">
                            <h4 className="text-sm font-bold line-clamp-1 dark:text-zinc-100 tracking-tight group-hover:text-primary transition-colors">{product.name}</h4>
                            <div className="flex items-end justify-between">
                                <div className="flex flex-col">
                                    <span className="text-primary font-bold text-lg leading-none">₦{product.price}</span>
                                    {product.oldPrice && <span className="text-[10px] text-zinc-400 line-through font-medium">₦{product.oldPrice}</span>}
                                </div>
                                <div className="bg-primary/10 text-primary p-2.5 rounded-xl scale-95 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <span className="material-symbols-outlined text-xl">shopping_bag</span>
                                </div>
                            </div>

                            <div className="mt-2 pt-2 border-t border-zinc-50 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-xs text-primary">person</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-zinc-400 truncate">{product.seller}</span>
                                </div>
                                <div className="flex items-center gap-0.5 text-zinc-300 font-bold">
                                    <span className="material-symbols-outlined text-[10px] fill-1 text-yellow-500">star</span>
                                    <span className="text-[10px] text-zinc-400">4.8</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </main>

            {/* Product Detail Sheet */}
            <ProductDetailSheetV2
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                product={selectedProduct}
            />

            {/* Live Request Response Sheet */}
            <LiveRequestResponseSheetV2
                isOpen={isRequestOpen}
                onClose={() => setIsRequestOpen(false)}
                request={selectedRequest}
            />
        </V2Layout>
    );
};
