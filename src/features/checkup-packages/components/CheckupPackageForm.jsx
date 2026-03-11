import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    DialogTitle, DialogContent, DialogActions, Button, Stepper, Step, StepLabel,
    Box, TextField, Select, MenuItem, FormControl, InputLabel, Typography,
    IconButton, Grid, Paper, Divider, Chip
} from '@mui/material';
import { Trash2, Plus, Info, ChevronRight } from 'lucide-react';
import { useCreateCheckupPackage, useUpdateCheckupPackage } from '../hooks/useCheckupPackages';
import { diagnosticsApi, categoriesApi } from '../../../services/api'; // Make sure this path corresponds to the actual location

const packageSchema = z.object({
    nameUz: z.string().min(3, "Paket nomi kamida 3ta harf bo'lishi kerak"),
    nameRu: z.string().optional(),
    nameEn: z.string().optional(),
    category: z.enum(['BASIC', 'SPECIALIZED', 'AGE_BASED']),
    shortDescription: z.string().max(200).optional(),
    fullDescription: z.string().optional(),
    imageUrl: z.string().url("Noto'g'ri rasm manzili").optional().or(z.literal('')),
    recommendedPrice: z.number().min(0).optional(),
    priceMin: z.number().min(0).optional(),
    priceMax: z.number().min(0).optional(),
    items: z.array(z.object({
        diagnosticServiceId: z.string().min(1, "Xizmatni tanlang"),
        quantity: z.number().min(1).default(1),
        isRequired: z.boolean().default(true)
    })).min(1, "Kamida bitta xizmat qo'shing")
});

const STEPS = ['Asosiy Ma\'lumotlar', 'Xizmatlar', 'Narx va Chegirma', 'Ko\'rib Chiqish'];

export default function CheckupPackageForm({ initialData, onClose }) {
    const [activeStep, setActiveStep] = useState(0);
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);
    const [selectedParentCategory, setSelectedParentCategory] = useState('');
    const [selectedSubcategory, setSelectedSubcategory] = useState('');
    const [parentCategories, setParentCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);

    const createMutation = useCreateCheckupPackage();
    const updateMutation = useUpdateCheckupPackage();

    const flattenCategories = (items) => {
        let flat = [];
        items?.forEach(item => {
            flat.push(item);
            if (item.children && item.children.length > 0) {
                flat = flat.concat(flattenCategories(item.children));
            }
        });
        return flat;
    };

    const fetchCategories = async () => {
        try {
            const data = await categoriesApi.list();

            // Flatten the tree structure
            const flatCategories = flattenCategories(data || []);
            setCategories(flatCategories);

            // Find the diagnostics root category (level 0)
            const diagnosticsRoot = flatCategories.find(cat =>
                cat.level === 0 && cat.slug === 'diagnostics'
            );

            // Separate parent categories (level 1) - only those under diagnostics root
            const parents = flatCategories.filter(cat =>
                cat.level === 1 && cat.parentId === diagnosticsRoot?.id
            ) || [];
            setParentCategories(parents);

            console.log('Categories loaded:', flatCategories.length, 'Diagnostics parent categories:', parents.length);
        } catch (e) {
            console.error("Kategoriyalarni yuklashda xatolik:", e);
        }
    };

    const fetchServices = async (categoryId = '') => {
        setLoadingServices(true);
        try {
            const params = categoryId ? { categoryId, limit: 500 } : { limit: 500 };
            const res = await diagnosticsApi.list(params);
            setServices(res.data || []);
        } catch (e) {
            console.error("Xizmatlarni yuklashda xatolik:", e);
        } finally {
            setLoadingServices(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchServices();
    }, []);

    // Update subcategories when parent category changes
    useEffect(() => {
        if (selectedParentCategory) {
            const subs = categories.filter(
                cat => cat.parentId === selectedParentCategory && cat.level === 2
            );
            setSubcategories(subs);
            setSelectedSubcategory(''); // Reset subcategory selection
        } else {
            setSubcategories([]);
            setSelectedSubcategory('');
        }
    }, [selectedParentCategory, categories]);

    // Fetch services when subcategory changes
    useEffect(() => {
        if (selectedSubcategory) {
            fetchServices(selectedSubcategory);
        } else {
            fetchServices();
        }
    }, [selectedSubcategory]);

    const {
        control,
        handleSubmit,
        watch,
        trigger,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(packageSchema),
        defaultValues: {
            nameUz: initialData?.nameUz || '',
            nameRu: initialData?.nameRu || '',
            nameEn: initialData?.nameEn || '',
            category: initialData?.category || 'BASIC',
            shortDescription: initialData?.shortDescription || '',
            fullDescription: initialData?.fullDescription || '',
            imageUrl: initialData?.imageUrl || '',
            recommendedPrice: initialData?.recommendedPrice || 0,
            priceMin: initialData?.priceMin || 0,
            priceMax: initialData?.priceMax || 0,
            items: initialData?.items?.map(i => ({
                diagnosticServiceId: i.diagnosticServiceId,
                quantity: i.quantity,
                isRequired: i.isRequired
            })) || [{ diagnosticServiceId: '', quantity: 1, isRequired: true }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    const watchItems = watch('items');
    const watchRecommendedPrice = watch('recommendedPrice');

    const handleNext = async () => {
        let valid = false;
        if (activeStep === 0) {
            valid = await trigger(['nameUz', 'category', 'shortDescription', 'imageUrl']);
        } else if (activeStep === 1) {
            valid = await trigger(['items']);
            if (valid) {
                // Auto calculate recommended price based on sum
                let sum = 0;
                watchItems.forEach(item => {
                    const srv = services.find(s => s.id === item.diagnosticServiceId);
                    if (srv) sum += (srv.priceRecommended || 0) * (item.quantity || 1);
                });
                control._defaultValues.recommendedPrice = sum;
                control._defaultValues.priceMin = sum;
                control._defaultValues.priceMax = sum;
            }
        } else if (activeStep === 2) {
            valid = await trigger(['recommendedPrice', 'priceMin', 'priceMax']);
        }

        if (valid) {
            setActiveStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const onSubmit = (data) => {
        if (initialData) {
            updateMutation.mutate({ id: initialData.id, data }, {
                onSuccess: () => onClose()
            });
        } else {
            createMutation.mutate(data, {
                onSuccess: () => onClose()
            });
        }
    };

    return (
        <Box sx={{ width: '100%', position: 'relative' }}>
            <DialogTitle sx={{ pb: 1, borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                <Typography variant="h6" fontWeight={600} color="#1e293b">
                    {initialData ? 'Paketni tahrirlash' : 'Yangi Paket Yaratish'}
                </Typography>
                <Stepper activeStep={activeStep} sx={{ mt: 3, mb: 2 }}>
                    {STEPS.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </DialogTitle>

            <DialogContent sx={{ minHeight: '400px', p: 3 }}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <form id="checkup-form" onSubmit={handleSubmit(onSubmit)}>
                        {/* STEP 1: Basic Info */}
                        {activeStep === 0 && (
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <Controller
                                        name="nameUz"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField {...field} fullWidth label="Nomi (UZ)" error={!!errors.nameUz} helperText={errors.nameUz?.message} />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Controller
                                        name="category"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControl fullWidth error={!!errors.category}>
                                                <InputLabel>Kategoriya</InputLabel>
                                                <Select {...field} label="Kategoriya">
                                                    <MenuItem value="BASIC">Asosiy</MenuItem>
                                                    <MenuItem value="SPECIALIZED">Ixtisoslashgan</MenuItem>
                                                    <MenuItem value="AGE_BASED">Yosh guruhi</MenuItem>
                                                </Select>
                                                {errors.category && <Typography color="error" variant="caption">{errors.category.message}</Typography>}
                                            </FormControl>
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Controller
                                        name="nameRu"
                                        control={control}
                                        render={({ field }) => <TextField {...field} fullWidth label="Nomi (RU) - Ixtiyoriy" />}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Controller
                                        name="nameEn"
                                        control={control}
                                        render={({ field }) => <TextField {...field} fullWidth label="Nomi (EN) - Ixtiyoriy" />}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Controller
                                        name="shortDescription"
                                        control={control}
                                        render={({ field }) => <TextField {...field} fullWidth multiline rows={2} label="Qisqacha tavsif" error={!!errors.shortDescription} helperText={errors.shortDescription?.message} />}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Controller
                                        name="imageUrl"
                                        control={control}
                                        render={({ field }) => <TextField {...field} fullWidth label="Rasm manzili (URL) - ixtiyoriy" error={!!errors.imageUrl} helperText={errors.imageUrl?.message} />}
                                    />
                                </Grid>
                            </Grid>
                        )}
                        {/* STEP 2: Items with Hierarchical Selection */}
                        {activeStep === 1 && (
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 2, color: '#64748b' }}>
                                    Paket ichiga kiruvchi xizmatlarni tanlang
                                </Typography>

                                {/* Category Filter - Hierarchical Selection */}
                                <Paper sx={{ p: 2, mb: 3, bgcolor: '#f0fdff', border: '1px solid #06b6d4' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                        <Info size={18} color="#0891b2" />
                                        <Typography variant="body2" fontWeight={600} color="#0891b2">
                                            Avval asosiy kategoriyani, keyin subcategoriyani tanlang
                                        </Typography>
                                    </Box>

                                    {/* Step 1: Parent Category Selection */}
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600, color: '#475569' }}>
                                            1️⃣ Asosiy Kategoriya
                                        </Typography>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Kategoriya tanlang</InputLabel>
                                            <Select
                                                value={selectedParentCategory}
                                                label="Kategoriya tanlang"
                                                onChange={(e) => setSelectedParentCategory(e.target.value)}
                                            >
                                                <MenuItem value="">
                                                    <em>Kategoriya tanlang...</em>
                                                </MenuItem>
                                                {parentCategories.map(parent => (
                                                    <MenuItem key={parent.id} value={parent.id}>
                                                        {parent.icon} {parent.nameUz}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    {/* Step 2: Subcategory Selection (disabled until parent is selected) */}
                                    <Box>
                                        <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600, color: '#475569' }}>
                                            2️⃣ Subcategoriya
                                        </Typography>
                                        <FormControl fullWidth size="small" disabled={!selectedParentCategory}>
                                            <InputLabel>Subcategoriya tanlang</InputLabel>
                                            <Select
                                                value={selectedSubcategory}
                                                label="Subcategoriya tanlang"
                                                onChange={(e) => setSelectedSubcategory(e.target.value)}
                                            >
                                                <MenuItem value="">
                                                    <em>{selectedParentCategory ? 'Subcategoriya tanlang...' : 'Avval kategoriya tanlang'}</em>
                                                </MenuItem>
                                                {subcategories.map(sub => (
                                                    <MenuItem key={sub.id} value={sub.id}>
                                                        <ChevronRight size={14} style={{ marginRight: '8px' }} />
                                                        {sub.nameUz}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    {/* Selected indicators */}
                                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {selectedParentCategory && (
                                            <Chip
                                                label={`Kategoriya: ${parentCategories.find(c => c.id === selectedParentCategory)?.nameUz || ''}`}
                                                onDelete={() => setSelectedParentCategory('')}
                                                color="primary"
                                                size="small"
                                            />
                                        )}
                                        {selectedSubcategory && (
                                            <Chip
                                                label={`Subcategoriya: ${subcategories.find(c => c.id === selectedSubcategory)?.nameUz || ''}`}
                                                onDelete={() => setSelectedSubcategory('')}
                                                color="success"
                                                size="small"
                                            />
                                        )}
                                    </Box>
                                </Paper>

                                {/* Service Items */}
                                {fields.map((field, index) => (
                                    <Paper key={field.id} variant="outlined" sx={{ p: 2, mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <Controller
                                            name={`items.${index}.diagnosticServiceId`}
                                            control={control}
                                            render={({ field: selectField }) => (
                                                <FormControl fullWidth size="small" error={!!errors?.items?.[index]?.diagnosticServiceId}>
                                                    <InputLabel>Xizmatni tanlang</InputLabel>
                                                    <Select {...selectField} label="Xizmatni tanlang" disabled={loadingServices}>
                                                        {services.length === 0 ? (
                                                            <MenuItem disabled>
                                                                {loadingServices ? 'Yuklanmoqda...' : 'Xizmatlar topilmadi'}
                                                            </MenuItem>
                                                        ) : (
                                                            services.map(s => (
                                                                <MenuItem key={s.id} value={s.id}>
                                                                    {s.nameUz} — {s.priceRecommended?.toLocaleString()} UZS
                                                                </MenuItem>
                                                            ))
                                                        )}
                                                    </Select>
                                                </FormControl>
                                            )}
                                        />
                                        <Controller
                                            name={`items.${index}.quantity`}
                                            control={control}
                                            render={({ field: qtyField }) => (
                                                <TextField {...qtyField} type="number" label="Soni" size="small" sx={{ width: '100px' }}
                                                    onChange={(e) => qtyField.onChange(parseInt(e.target.value, 10))} />
                                            )}
                                        />
                                        <IconButton color="error" onClick={() => remove(index)} disabled={fields.length === 1}>
                                            <Trash2 size={20} />
                                        </IconButton>
                                    </Paper>
                                ))}
                                <Button startIcon={<Plus size={16} />} onClick={() => append({ diagnosticServiceId: '', quantity: 1, isRequired: true })} variant="outlined" sx={{ mt: 1, textTransform: 'none' }}>
                                    Xizmat qo'shish
                                </Button>
                            </Box>
                        )}
                        {/* STEP 3: Pricing */}
                        {activeStep === 2 && (
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Box sx={{ p: 2, bgcolor: '#eff6ff', borderRadius: 2, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                        <Info color="#3b82f6" size={20} style={{ marginTop: '2px' }} />
                                        <Typography variant="body2" color="#1e3a8a">
                                            Narxlar sizning tanlangan xizmatlaringiz asosida avtomatik hisoblangan. Klinikalarga narxlarni o'zgartirish huquqini berish uchun Minimal va Maksimal narxlarni belgilang.
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Controller
                                        name="recommendedPrice"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField {...field} type="number" fullWidth label="Tavsiya narx (UZS)"
                                                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                                                error={!!errors.recommendedPrice} helperText={errors.recommendedPrice?.message} />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Controller
                                        name="priceMin"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField {...field} type="number" fullWidth label="Minimal narx (UZS)"
                                                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                                                error={!!errors.priceMin} helperText={errors.priceMin?.message} />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Controller
                                        name="priceMax"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField {...field} type="number" fullWidth label="Maksimal narx (UZS)"
                                                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                                                error={!!errors.priceMax} helperText={errors.priceMax?.message} />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        )}
                        {/* STEP 4: Preview */}
                        {activeStep === 3 && (
                            <Box>
                                <Typography variant="h6" sx={{ mb: 2 }}>{watch('nameUz')}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Kategoriya: <b>{watch('category')}</b><br />
                                    Narx: <b>{watch('recommendedPrice')?.toLocaleString()} UZS</b><br />
                                    Min/Max: {watch('priceMin')?.toLocaleString()} - {watch('priceMax')?.toLocaleString()} UZS
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Kiritilgan Xizmatlar ({watchItems.length} ta)</Typography>
                                {watchItems.map((item, idx) => {
                                    const s = services.find(x => x.id === item.diagnosticServiceId);
                                    return (
                                        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #f1f5f9' }}>
                                            <Typography variant="body2">{s?.nameUz || 'Noma\'lum xizmat'}</Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                {(s?.priceRecommended || 0) * (item.quantity || 1)} UZS ({item.quantity} ta)
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}
                    </form>
                </Paper>
            </DialogContent>

            <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                <Button onClick={onClose} color="inherit" sx={{ mr: 'auto', textTransform: 'none' }}>
                    Bekor qilish
                </Button>
                <Button disabled={activeStep === 0} onClick={handleBack} sx={{ textTransform: 'none' }}>
                    Orqaga
                </Button>
                {activeStep === STEPS.length - 1 ? (
                    <Button type="submit" form="checkup-form" variant="contained" color="primary" disabled={createMutation.isPending || updateMutation.isPending} sx={{ textTransform: 'none', px: 3 }}>
                        {createMutation.isPending || updateMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                    </Button>
                ) : (
                    <Button variant="contained" onClick={handleNext} sx={{ textTransform: 'none', px: 3 }}>
                        Keyingi
                    </Button>
                )}
            </DialogActions>
        </Box>
    );
}
