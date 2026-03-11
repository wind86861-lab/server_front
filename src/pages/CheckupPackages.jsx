import React, { useState } from 'react';
import { useCheckupPackages, useTogglePackageStatus, useDeleteCheckupPackage } from '../features/checkup-packages/hooks/useCheckupPackages';
import { DataGrid } from '@mui/x-data-grid';
import {
    Box, Button, Typography, Chip, IconButton, Tooltip,
    Dialog, Select, MenuItem, FormControl, InputLabel, TextField
} from '@mui/material';
import {
    Plus, Edit3, Trash2, Eye, ShieldAlert, CheckCircle, Ban, Search, Filter
} from 'lucide-react';
import CheckupPackageForm from '../features/checkup-packages/components/CheckupPackageForm';
import './CheckupPackages.css';

const CATEGORY_MAP = {
    BASIC: { label: 'Bazaviy', color: 'primary' },
    SPECIALIZED: { label: 'Ixtisoslashgan', color: 'secondary' },
    AGE_BASED: { label: 'Yosh guruhi', color: 'success' }
};

const CheckupPackages = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);

    const { data, isLoading } = useCheckupPackages({
        page,
        limit: pageSize,
        search: search.length > 2 ? search : undefined,
        category: category || undefined
    });

    const toggleStatusMutation = useTogglePackageStatus();
    const deleteMutation = useDeleteCheckupPackage();

    const handleCreate = () => {
        setEditingPackage(null);
        setFormOpen(true);
    };

    const handleEdit = (pkg) => {
        setEditingPackage(pkg);
        setFormOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm("Rostdan ham ushbu paketni o'chirmoqchimisiz?")) {
            deleteMutation.mutate(id);
        }
    };

    const handleToggleStatus = (id, currentStatus) => {
        if (window.confirm(`Paketni ${currentStatus ? 'nofaol' : 'faol'} qilmoqchimisiz?`)) {
            toggleStatusMutation.mutate({ id, activate: !currentStatus });
        }
    };

    const columns = [
        {
            field: 'nameUz',
            headerName: 'Paket Nomi',
            flex: 1,
            renderCell: (params) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>
                        {params.row.category === 'BASIC' ? '🩺' : params.row.category === 'SPECIALIZED' ? '❤️' : '👨‍⚕️'}
                    </span>
                    <span style={{ fontWeight: 500 }}>{params.value}</span>
                </div>
            )
        },
        {
            field: 'category',
            headerName: 'Kategoriya',
            width: 150,
            renderCell: (params) => {
                const conf = CATEGORY_MAP[params.value] || { label: params.value, color: 'default' };
                return <Chip label={conf.label} color={conf.color} size="small" />;
            }
        },
        {
            field: 'itemsCount',
            headerName: 'Xizmatlar',
            width: 100,
            renderCell: (params) => (
                <Chip label={`${params.row._count?.items || 0} ta`} variant="outlined" size="small" />
            )
        },
        {
            field: 'recommendedPrice',
            headerName: 'Tavsiya Narx',
            width: 150,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#10b981' }}>
                    {params.value?.toLocaleString()} UZS
                </Typography>
            )
        },
        {
            field: 'isActive',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => (
                <Chip
                    icon={params.value ? <CheckCircle size={14} /> : <Ban size={14} />}
                    label={params.value ? 'Faol' : 'Nofaol'}
                    color={params.value ? 'success' : 'default'}
                    size="small"
                />
            )
        },
        {
            field: 'actions',
            headerName: 'Amallar',
            width: 180,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Tahrirlash">
                        <IconButton size="small" color="primary" onClick={() => handleEdit(params.row)}>
                            <Edit3 size={18} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={params.row.isActive ? "Nofaol qilish" : "Faollashtirish"}>
                        <IconButton size="small" color={params.row.isActive ? "warning" : "success"} onClick={() => handleToggleStatus(params.row.id, params.row.isActive)}>
                            {params.row.isActive ? <Ban size={18} /> : <CheckCircle size={18} />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="O'chirish">
                        <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
                            <Trash2 size={18} />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ];

    return (
        <div className="packages-container">
            {/* Stat Cards */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="stat-card" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                    <div className="value" style={{ fontSize: '24px', fontWeight: 600, color: '#111827' }}>{data?.meta?.total || 0}</div>
                    <div className="label" style={{ fontSize: '14px', color: '#6b7280' }}>Umumiy Paketlar</div>
                </div>
                <div className="stat-card" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                    <div className="value" style={{ fontSize: '24px', fontWeight: 600, color: '#111827' }}>{(data?.items?.filter(p => p.isActive).length) || 0}</div>
                    <div className="label" style={{ fontSize: '14px', color: '#6b7280' }}>Faol Paketlar</div>
                </div>
                <div className="stat-card" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                    <div className="value" style={{ fontSize: '24px', fontWeight: 600, color: '#111827' }}>{(data?.items?.filter(p => !p.isActive).length) || 0}</div>
                    <div className="label" style={{ fontSize: '14px', color: '#6b7280' }}>Nofaol Paketlar</div>
                </div>
            </div>
            {/* Header */}
            <div className="packages-header">
                <div className="header-title">
                    <div className="icon-box">
                        <ShieldAlert size={24} color="#3b82f6" />
                    </div>
                    <div>
                        <h1>Checkup Paketlar</h1>
                        <p>Super admin panel - Diagnostika paketlarini boshqarish</p>
                    </div>
                </div>
                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={handleCreate}
                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, px: 3, py: 1 }}
                >
                    Yangi Yaratish
                </Button>
            </div>

            <div className="packages-toolbar">
                {/* Search Box with MUI TextField */}
                <div className="search-box" style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} className="search-icon" />
                    <TextField
                        variant="outlined"
                        placeholder="Paket nomini qidiring..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        fullWidth
                        size="small"
                        InputProps={{
                            startAdornment: null,
                            style: { paddingLeft: '40px' }
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                            '& .MuiInputBase-input': { height: '40px' }
                        }}
                        className="search-input"
                    />
                </div>

                <FormControl size="small" sx={{ minWidth: 200, bgcolor: 'white', borderRadius: 1 }}>
                    <InputLabel id="category-filter-label">Kategoriya</InputLabel>
                    <Select
                        labelId="category-filter-label"
                        value={category}
                        label="Kategoriya"
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <MenuItem value="">Barchasi</MenuItem>
                        <MenuItem value="BASIC">Bazaviy</MenuItem>
                        <MenuItem value="SPECIALIZED">Ixtisoslashgan</MenuItem>
                        <MenuItem value="AGE_BASED">Yosh guruhi</MenuItem>
                    </Select>
                </FormControl>
            </div>

            <div className="packages-grid-container">
                <DataGrid
                    rows={data?.items || []}
                    columns={columns}
                    rowCount={data?.meta?.total || 0}
                    loading={isLoading}
                    paginationMode="server"
                    paginationModel={{ page: page - 1, pageSize }}
                    onPaginationModelChange={(model) => {
                        setPage(model.page + 1);
                        setPageSize(model.pageSize);
                    }}
                    pageSizeOptions={[10, 25, 50]}
                    disableRowSelectionOnClick
                    autoHeight
                    sx={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: '#f9fafb',
                            borderBottom: '1px solid #e5e7eb',
                            color: '#4b5563',
                            fontSize: '14px',
                            fontWeight: 600
                        },
                        '& .MuiDataGrid-cell': {
                            borderBottom: '1px solid #f3f4f6',
                        },
                        '& .MuiDataGrid-row:hover': {
                            backgroundColor: '#f8fafc',
                        }
                    }}
                />
            </div>

            {/* Form Dialog with MUI DialogTitle and actions */}
            <Dialog
                open={formOpen}
                onClose={() => setFormOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: '12px', padding: '24px' } }}
            >
                <CheckupPackageForm
                    initialData={editingPackage}
                    onClose={() => setFormOpen(false)}
                />
            </Dialog>
        </div>
    );
};

export default CheckupPackages;
