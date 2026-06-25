import { EXPORT_OPTIONS, THEME_COLORS } from '@/constants/utilities';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import SunDrawer from './SunDrawer';

export const ExportSheet: React.FC<ExportSheetProps> = ({
    onClose,
    onExport,
    isExporting,
    exportError,
    title,
}) => {
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('png');

    return (
        <SunDrawer
            visible
            onClose={onClose}
            icon="share-2"
            label="Export"
            title={title}
            ctaLabel={selectedFormat === 'csv' ? 'Download CSV' : 'Share chart'}
            ctaLoading={isExporting}
            ctaDisabled={isExporting}
            onCta={() => onExport(selectedFormat)}
        >
            {/* Format section label */}
            <Text style={{
                fontSize: 10, fontFamily: 'elms-bold',
                textTransform: 'uppercase', letterSpacing: 1.2,
                color: 'rgba(20,20,18,0.35)', marginBottom: 12,
            }}>
                Choose format
            </Text>

            {/* Format options */}
            <View style={{ gap: 10, marginBottom: 8 }}>
                {EXPORT_OPTIONS.map((opt) => {
                    const active = selectedFormat === opt.format;
                    return (
                        <TouchableOpacity
                            key={opt.format}
                            onPress={() => setSelectedFormat(opt.format)}
                            activeOpacity={0.85}
                            style={{
                                flexDirection: 'row', alignItems: 'center',
                                padding: 14,
                                borderRadius: 20,
                                backgroundColor: active ? THEME_COLORS.dark : THEME_COLORS.light,
                                borderWidth: active ? 0 : 1,
                                borderColor: THEME_COLORS.dark,
                            }}
                        >
                            {/* Icon block */}
                            <View style={{
                                width: 40, height: 40, borderRadius: 14,
                                backgroundColor: active ? THEME_COLORS.primary : THEME_COLORS.background,
                                alignItems: 'center', justifyContent: 'center',
                                marginRight: 14,
                            }}>
                                <Feather
                                    name={opt.icon}
                                    size={18}
                                    color={active ? THEME_COLORS.dark : THEME_COLORS.grey}
                                />
                            </View>

                            {/* Label + sublabel */}
                            <View style={{ flex: 1 }}>
                                <Text style={{
                                    fontSize: 15, fontFamily: 'elms-bold',
                                    fontStyle: 'italic', color: active ? THEME_COLORS.primary : THEME_COLORS.dark,
                                }}>
                                    {opt.label}
                                </Text>
                                <Text style={{
                                    fontSize: 11, fontFamily: 'elms-regular',
                                    color: active ? THEME_COLORS.primary : THEME_COLORS.dark,
                                    marginTop: 1,
                                }}>
                                    {opt.sublabel}
                                </Text>
                            </View>

                            {/* Radio dot */}
                            <View style={{
                                width: 20, height: 20, borderRadius: 10,
                                borderWidth: 1.5,
                                borderColor: active ? THEME_COLORS.primary : 'rgba(20,20,18,0.15)',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                {active && (
                                    <View style={{
                                        width: 9, height: 9, borderRadius: 4.5,
                                        backgroundColor: THEME_COLORS.primary,
                                    }} />
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Error state */}
            {exportError && (
                <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 10,
                    backgroundColor: 'rgba(239,68,68,0.08)',
                    borderWidth: 1, borderColor: THEME_COLORS.error,
                    borderRadius: 16, padding: 12, marginTop: 4,
                }}>
                    <Feather name="alert-circle" size={14} color={THEME_COLORS.error} />
                    <Text style={{ fontSize: 11, fontFamily: 'elms-bold', fontStyle: 'italic', color: THEME_COLORS.error, flex: 1 }}>
                        {exportError}
                    </Text>
                </View>
            )}
        </SunDrawer>
    );
};