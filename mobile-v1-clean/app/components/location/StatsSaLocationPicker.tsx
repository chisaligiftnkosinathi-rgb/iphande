import React, { useState, useEffect } from "react";
import { View, TextInput, Text, TouchableOpacity, ScrollView, StyleSheet, Keyboard } from "react-native";
import { useStatsSaPlacesSearch } from "../../../src/state/useStatsSaPlacesSearch";

export type StatsSaPlace = {
  id: string;
  name: string;
  full_name: string;
  province: string;
  municipality: string;
  type: string;
  lat?: number;
  lng?: number;
};

interface Props {
  value?: StatsSaPlace | null;
  onChange: (place: StatsSaPlace | null) => void;
  placeholder?: string;
}

export default function StatsSaLocationPicker({
  value,
  onChange,
  placeholder = "Type a location...",
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { results, loading } = useStatsSaPlacesSearch(query);

  // Close dropdown when typing stops or selection made
  useEffect(() => {
    if (value) {
      setQuery("");
    }
  }, [value]);

  const handleTextChange = (text: string) => {
    setQuery(text);
    setOpen(true);
    if (value) {
      onChange(null);
    }
  };

  const handleSelect = (place: StatsSaPlace) => {
    onChange(place);
    setQuery("");
    setOpen(false);
    Keyboard.dismiss();
  };

  const displayValue = value ? value.full_name : query;

  return (
    <View style={styles.container}>
      <TextInput
        value={displayValue}
        placeholder={placeholder}
        onChangeText={handleTextChange}
        onFocus={() => setOpen(true)}
        style={styles.input}
        placeholderTextColor="#9CA3AF"
      />

      {open && (query.length > 0 || loading) && (
        <View style={styles.dropdown}>
          {loading && (
            <View style={styles.messageItem}>
              <Text style={styles.messageText}>Searching locations...</Text>
            </View>
          )}

          {!loading && results.length === 0 && query.length > 2 && (
            <View style={styles.messageItem}>
              <Text style={styles.messageText}>No official locations found.</Text>
            </View>
          )}

          {!loading && (
            <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll}>
              {results.map((place) => (
                <TouchableOpacity
                  key={place.id}
                  style={styles.resultItem}
                  onPress={() => handleSelect(place)}
                >
                  <Text style={styles.placeName}>{place.name}</Text>
                  <Text style={styles.placeDetails}>
                    {place.province} • {place.municipality || "Unknown Municipality"}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    position: "relative",
    zIndex: 9999,
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 250,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 10000,
  },
  scroll: {
    maxHeight: 250,
  },
  messageItem: {
    padding: 16,
  },
  messageText: {
    color: "#6B7280",
    fontSize: 14,
  },
  resultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  placeName: {
    fontWeight: "700",
    color: "#111827",
    fontSize: 15,
  },
  placeDetails: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
});
