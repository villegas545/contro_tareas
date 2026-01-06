import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SearchInput } from './SearchInput';

interface AdvancedFilterControlsProps {
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;

    // Search
    searchText?: string;
    setSearchText?: (text: string) => void;
    searchPlaceholder?: string;

    // Status
    statusFilter?: string;
    setStatusFilter?: (status: any) => void;
    statusOptions?: { id: string; label: string }[];

    // Type
    typeFilter?: string;
    setTypeFilter?: (type: any) => void;
    typeOptions?: { id: string; label: string }[];

    // Frequency (Optional)
    frequencyFilter?: string;
    setFrequencyFilter?: (freq: any) => void;
    frequencyOptions?: { id: string; label: string }[];

    // Extra Content (e.g. DatePickers)
    children?: React.ReactNode;
}

export const AdvancedFilterControls = ({
    showFilters,
    setShowFilters,
    searchText,
    setSearchText,
    searchPlaceholder = "Buscar...",
    statusFilter,
    setStatusFilter,
    statusOptions = [
        { id: 'all', label: 'Todos' },
        { id: 'pending', label: '⏳ Pendientes' },
        { id: 'completed', label: '✅ Por Revisar' },
        { id: 'verified', label: '⭐️ Completados' },
        { id: 'expired', label: '❌ Fallados' },
    ],
    typeFilter,
    setTypeFilter,
    typeOptions = [
        { id: 'all', label: 'Todos' },
        { id: 'responsibility', label: '🎁 Bonos' },
        { id: 'extra', label: '💵 Extras' },
        { id: 'school', label: '🎓 Escolar' },
    ],
    frequencyFilter,
    setFrequencyFilter,
    frequencyOptions = [
        { id: 'all', label: 'Todas' },
        { id: 'daily', label: '📅 Diaria' },
        { id: 'weekly', label: '📅 Semanal' },
        { id: 'one-time', label: '☝️ Una vez' },
    ],
    children
}: AdvancedFilterControlsProps) => {

    return (
        <View>
            <TouchableOpacity
                onPress={() => setShowFilters(!showFilters)}
                className="flex-row justify-between items-center py-2"
            >
                <Text className="text-gray-500 text-xs font-bold uppercase">Filtros Avanzados</Text>
                <Text className="text-gray-500 text-xs">{showFilters ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showFilters && (
                <View className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mt-2">

                    {/* Search */}
                    {setSearchText && (
                        <View className="mb-4">
                            <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2">Buscar:</Text>
                            <SearchInput
                                value={searchText || ''}
                                onChangeText={setSearchText}
                                placeholder={searchPlaceholder}
                            />
                        </View>
                    )}

                    {/* Extra Children (e.g. Date/Period pickers) */}
                    {children && <View className="mb-4">{children}</View>}

                    {/* Status Filter */}
                    {setStatusFilter && (
                        <View className="mb-4">
                            <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2">Estado:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                {statusOptions.map(f => (
                                    <TouchableOpacity
                                        key={f.id}
                                        onPress={() => setStatusFilter(f.id)}
                                        className={`px-3 py-1.5 rounded-full border ${statusFilter === f.id
                                            ? 'bg-indigo-600 border-indigo-600'
                                            : 'bg-white border-gray-300'
                                            }`}
                                    >
                                        <Text className={`text-xs font-semibold ${statusFilter === f.id ? 'text-white' : 'text-gray-600'}`}>
                                            {f.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Type Filter */}
                    {setTypeFilter && (
                        <View className={frequencyFilter ? "mb-4" : ""}>
                            <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2">Tipo:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                {typeOptions.map(f => (
                                    <TouchableOpacity
                                        key={f.id}
                                        onPress={() => setTypeFilter(f.id)}
                                        className={`px-3 py-1.5 rounded-full border ${typeFilter === f.id
                                            ? 'bg-indigo-600 border-indigo-600'
                                            : 'bg-white border-gray-300'
                                            }`}
                                    >
                                        <Text className={`text-xs font-semibold ${typeFilter === f.id ? 'text-white' : 'text-gray-600'}`}>
                                            {f.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Frequency Filter */}
                    {setFrequencyFilter && (
                        <View>
                            <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2">Frecuencia:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                {frequencyOptions.map(f => (
                                    <TouchableOpacity
                                        key={f.id}
                                        onPress={() => setFrequencyFilter(f.id)}
                                        className={`px-3 py-1.5 rounded-full border ${frequencyFilter === f.id
                                            ? 'bg-indigo-600 border-indigo-600'
                                            : 'bg-white border-gray-300'
                                            }`}
                                    >
                                        <Text className={`text-xs font-semibold ${frequencyFilter === f.id ? 'text-white' : 'text-gray-600'}`}>
                                            {f.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};
