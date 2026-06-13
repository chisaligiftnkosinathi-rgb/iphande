import React, { useState } from "react";
import { TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Text, ViewStyle, TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";

interface ShareButtonProps {
    fetchShareText: () => Promise<{ share_text: string }>;
    label?: string;
    style?: ViewStyle;
    textStyle?: TextStyle;
    iconColor?: string;
}

export function ShareButton({ fetchShareText, label = "Share", style, textStyle, iconColor = "#666" }: ShareButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleShare = async () => {
        try {
            setLoading(true);
            const { share_text } = await fetchShareText();
            
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                // expo-sharing is mostly for files. For text only we might use Share from react-native
                const { Share } = require("react-native");
                await Share.share({
                    message: share_text,
                });
            } else {
                Alert.alert("Sharing not available", "Sharing is not available on this device.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not generate share text.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableOpacity style={[styles.button, style]} onPress={handleShare} disabled={loading}>
            {loading ? (
                <ActivityIndicator size="small" color={iconColor} />
            ) : (
                <Ionicons name="share-social-outline" size={20} color={iconColor} />
            )}
            {label && <Text style={[styles.text, textStyle]}>{label}</Text>}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 8,
    },
    text: {
        marginLeft: 8,
        fontSize: 14,
        color: "#666",
        fontWeight: "500",
    }
});
