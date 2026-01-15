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

import { useTaskContext } from '../../context/TaskContext';

export const AdvancedFilterControls = ({
    showFilters,
    setShowFilters,
    searchText,
    setSearchText,
    searchPlaceholder,
    statusFilter,
    setStatusFilter,
    statusOptions,
    typeFilter,
    setTypeFilter,
    typeOptions,
    frequencyFilter,
    setFrequencyFilter,
    frequencyOptions,
    children
}: AdvancedFilterControlsProps) => {
    const { t } = useTaskContext();

    const defaultStatusOptions = [
        { id: 'all', label: t('filter.all') },
        { id: 'pending', label: `⏳ ${t('status.pending')}` },
        { id: 'completed', label: `✅ ${t('status.in_review')}` }, // Assuming completed = in review for parent
        { id: 'verified', label: `⭐️ ${t('status.verified')}` },
        { id: 'expired', label: `❌ ${t('status.expired')}` },
    ];

    // Use props or defaults
    const finalStatusOptions = statusOptions || defaultStatusOptions;

    const defaultTypeOptions = [
        { id: 'all', label: t('filter.all') },
        { id: 'responsibility', label: `🎁 ${t('task.bonus')}` },
        { id: 'extra', label: `💵 ${t('task.extra')}` },
        { id: 'school', label: `🎓 ${t('task.school')}` },
    ];
    const finalTypeOptions = typeOptions || defaultTypeOptions;

    const defaultFrequencyOptions = [
        { id: 'all', label: t('filter.all') },
        { id: 'daily', label: `📅 ${t('frequency.daily')}` },
        { id: 'weekly', label: `📅 ${t('frequency.weekly')}` },
        { id: 'one-time', label: `☝️ ${t('frequency.one_time')}` },
    ];
    const finalFrequencyOptions = frequencyOptions || defaultFrequencyOptions;

    return (
        <View>
            <TouchableOpacity
                onPress={() => setShowFilters(!showFilters)}
                className="flex-row justify-between items-center py-2"
            >
                <Text className="text-gray-500 text-xs font-bold uppercase">{t('filter.advanced_filters')}</Text>
                <Text className="text-gray-500 text-xs">{showFilters ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showFilters && (
                <View className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mt-2">

                    {/* Search */}
                    {setSearchText && (
                        <View className="mb-4">
                            <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2">{t('common.search')}:</Text>
                            <SearchInput
                                value={searchText || ''}
                                onChangeText={setSearchText}
                                placeholder={searchPlaceholder || t('common.search')}
                            />
                        </View>
                    )}

                    {/* Extra Children (e.g. Date/Period pickers) */}
                    {children && <View className="mb-4">{children}</View>}

                    {/* Status Filter */}
                    {setStatusFilter && (
                        <View className="mb-4">
                            <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2">{t('filter.status')}:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                {finalStatusOptions.map(f => (
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
                            <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2">{t('filter.type')}:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                {finalTypeOptions.map(f => (
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
                            <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2">{t('filter.frequency')}:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                {finalFrequencyOptions.map(f => (
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
