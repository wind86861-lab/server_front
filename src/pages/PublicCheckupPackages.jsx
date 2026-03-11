import React, { useState } from 'react';
import { usePublicCheckupPackages } from '../features/checkup-packages/hooks/useCheckupPackages';
import {
    Box, Typography, Card, CardContent, Chip, Grid, Divider, Button,
    Skeleton, InputAdornment, TextField, MenuItem
} from '@mui/material';
import { Search, Activity, Heart, Shield, CheckCircle, Percent } from 'lucide-react';
import './CheckupPackages.css';

const CATEGORY_MAP = {
    BASIC: { label: 'Bazaviy', icon: <Activity size={20} color="#3b82f6" />, color: '#eff6ff', textColor: '#2563eb' },
    SPECIALIZED: { label: 'Ixtisoslashgan', icon: <Heart size={20} color="#ef4444" />, color: '#fef2f2', textColor: '#dc2626' },
    AGE_BASED: { label: 'Yosh guruhi', icon: <Shield size={20} color="#10b981" />, color: '#ecfdf5', textColor: '#059669' }
};

export default function PublicCheckupPackages({ clinicId = 'cl123456789' }) {
    // Hardcoded clinicId for demo since there's no dynamic routing setup for clinics yet
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');

    const { data: packages, isLoading } = usePublicCheckupPackages({
        clinicId,
        search: search.length > 2 ? search : undefined,
        category: category || undefined
    });

    return (
        <Box sx={{ p: 4, maxWidth: '1200px', mx: 'auto' }}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
                <Typography variant="h3" fontWeight={700} color="#1e293b" gutterBottom>
                    Sog'ligingizni to'liq tekshiring
                </Typography>
                <Typography variant="h6" color="text.secondary" fontWeight={400}>
                    Noyob va hamyonbop Checkup paketlarimiz bilan kasalliklarni dastlabki bosqichda aniqlang
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
                <TextField
                    placeholder="Paket nomini qidiring..."
                    variant="outlined"
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ flexGrow: 1, minWidth: '300px', bgcolor: 'white' }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><Search size={20} /></InputAdornment>
                    }}
                />
                <TextField
                    select
                    size="small"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    sx={{ minWidth: '200px', bgcolor: 'white' }}
                    label="Kategoriya"
                >
                    <MenuItem value="">Barchasi</MenuItem>
                    <MenuItem value="BASIC">Bazaviy</MenuItem>
                    <MenuItem value="SPECIALIZED">Ixtisoslashgan</MenuItem>
                    <MenuItem value="AGE_BASED">Yosh guruhi</MenuItem>
                </TextField>
            </Box>

            <Grid container spacing={4}>
                {isLoading ? (
                    Array.from(new Array(3)).map((_, i) => (
                        <Grid item xs={12} md={4} key={i}>
                            <Card sx={{ borderRadius: 4, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                                <Skeleton variant="rectangular" height={160} />
                                <CardContent>
                                    <Skeleton width="60%" height={32} />
                                    <Skeleton width="40%" height={24} sx={{ mb: 2 }} />
                                    <Skeleton width="100%" height={20} />
                                    <Skeleton width="100%" height={20} />
                                    <Skeleton width="100%" height={20} sx={{ mb: 2 }} />
                                    <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2 }} />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                ) : packages?.length === 0 ? (
                    <Grid item xs={12}>
                        <Box sx={{ textAlign: 'center', p: 8, bgcolor: 'white', borderRadius: 4 }}>
                            <Search size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
                            <Typography variant="h6" color="text.secondary">
                                Hech qanday paket topilmadi
                            </Typography>
                        </Box>
                    </Grid>
                ) : (
                    packages?.map((cp) => {
                        const pkg = cp.package;
                        const cat = CATEGORY_MAP[pkg.category] || CATEGORY_MAP.BASIC;
                        const totalOriginalPrice = cp.clinicPrice + pkg.discount;
                        const discountPercent = Math.round((pkg.discount / totalOriginalPrice) * 100);

                        return (
                            <Grid item xs={12} md={4} key={cp.id}>
                                <Card sx={{
                                    borderRadius: 4,
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
                                    }
                                }}>
                                    <Box sx={{ p: 3, pb: 2, bgcolor: cat.color, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Chip
                                                icon={cat.icon}
                                                label={cat.label}
                                                size="small"
                                                sx={{
                                                    bgcolor: 'white',
                                                    color: cat.textColor,
                                                    fontWeight: 600,
                                                    '& .MuiChip-icon': { color: cat.textColor }
                                                }}
                                            />
                                            {pkg.discount > 0 && (
                                                <Chip
                                                    icon={<Percent size={14} />}
                                                    label={`${discountPercent}% Chegirma`}
                                                    size="small"
                                                    color="error"
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            )}
                                        </Box>
                                        <Typography variant="h5" fontWeight={700} color="#1e293b" gutterBottom>
                                            {pkg.nameUz}
                                        </Typography>
                                        <Typography variant="body2" color="#64748b" sx={{ minHeight: '40px' }}>
                                            {pkg.shortDescription}
                                        </Typography>
                                    </Box>

                                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                        <Typography variant="subtitle2" fontWeight={600} color="#334155" mb={1.5}>
                                            Paket o'z ichiga oladi ({pkg.items?.length || 0} ta xizmat):
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {pkg.items?.slice(0, 4).map((item, idx) => (
                                                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <CheckCircle size={16} color="#10b981" />
                                                    <Typography variant="body2" color="#475569">
                                                        {item.serviceName} {item.quantity > 1 ? `(x${item.quantity})` : ''}
                                                    </Typography>
                                                </Box>
                                            ))}
                                            {(pkg.items?.length || 0) > 4 && (
                                                <Typography variant="body2" color="#3b82f6" fontWeight={500} sx={{ mt: 0.5, pl: 3 }}>
                                                    + yana {(pkg.items?.length || 0) - 4} ta tahlil...
                                                </Typography>
                                            )}
                                        </Box>

                                        {cp.customNotes && (
                                            <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                                <Typography variant="body2" color="#64748b" fontStyle="italic">
                                                    "{cp.customNotes}"
                                                </Typography>
                                            </Box>
                                        )}
                                    </CardContent>

                                    <Box sx={{ p: 3, pt: 0 }}>
                                        <Divider sx={{ mb: 2 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3 }}>
                                            <Typography variant="body2" color="text.secondary" fontWeight={500}>Jami narx:</Typography>
                                            <Box sx={{ textAlign: 'right' }}>
                                                {pkg.discount > 0 && (
                                                    <Typography variant="body2" color="text.disabled" sx={{ textDecoration: 'line-through' }}>
                                                        {totalOriginalPrice.toLocaleString()} UZS
                                                    </Typography>
                                                )}
                                                <Typography variant="h5" fontWeight={800} color="#1e293b">
                                                    {cp.clinicPrice.toLocaleString()} <span style={{ fontSize: '16px', fontWeight: 600 }}>UZS</span>
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            size="large"
                                            sx={{
                                                borderRadius: '12px',
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                bgcolor: '#2563eb',
                                                '&:hover': { bgcolor: '#1d4ed8' }
                                            }}
                                        >
                                            Buyurtma berish
                                        </Button>
                                    </Box>
                                </Card>
                            </Grid>
                        );
                    })
                )}
            </Grid>
        </Box>
    );
}
