import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FastImage from "react-native-fast-image";
import axios from "axios";

const defaultImage = "https://cdn1.iconfinder.com/data/icons/metro-ui-dock-icon-set--icons-by-dakirby/512/Default.png";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const storedHistory = await AsyncStorage.getItem("searchHistory");
      if (storedHistory) setHistory(JSON.parse(storedHistory));
    } catch (error) {
    }
  };

  const saveSearchHistory = async (selectedItem:any) => {
    try {
      const updatedHistory = [selectedItem, ...history?.filter((item) => item?.id !== selectedItem?.id)]?.slice(0, 10);
      setHistory(updatedHistory);
      await AsyncStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
    } catch (error) {
    }
  };

  const fetchSuggestions = async (text:string, nextPage = 0) => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      let newSuggestions = [];
      const response = await axios.get(
        `https://be-v2.convose.com/autocomplete/interests?q=${text}&limit=10&from=${nextPage * 10}`,
        {
          headers: {
            Authorization: "Jy8RZCXvvc6pZQUu2QZ2",
            Accept: "application/json",
          },
        }
      );
      newSuggestions = response?.data?.autocomplete || [];
      setSuggestions((prev) => (nextPage === 0 ? newSuggestions : [...prev, ...newSuggestions]));
      setPage(nextPage);
      setHasMore(newSuggestions.length > 0);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchText:string) => {
    setQuery(searchText);
    setSuggestions([]); 
    setHasMore(true); 
    fetchSuggestions(searchText, 0); 
  };

  const handleSelect = (selectedItem:any) => {
    setQuery(selectedItem?.name);
    saveSearchHistory(selectedItem);
    setSuggestions([]);
    Keyboard.dismiss();
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchSuggestions(query, page + 1);
    }
  };

  const filteredHistory = history.filter((item) =>
    item?.name?.toLowerCase()?.includes(query?.toLowerCase())
  );

  const filteredSuggestions = suggestions.filter(
    (suggestion) => !history?.some((historyItem) => historyItem?.name === suggestion?.name)
  );

  const combinedData = [
    ...filteredHistory.map((item) => ({ ...item, isHistory: true })), 
    ...filteredSuggestions.map((item) => ({ ...item, isHistory: false })), 
  ];

  const renderItem = ({ item }:any) => (
    <TouchableOpacity onPress={() => handleSelect(item)}>
      <View style={styles.cardWrapper}>
        <FastImage
          source={{ uri: item.avatar || defaultImage }}
          style={styles.imageStyle}
          resizeMode={FastImage.resizeMode.contain}
        />
        <Text>{item?.name}</Text>
        {item?.isHistory && <Text style={styles.nameStyle}>(Already added)</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.mainContainer}>
    <KeyboardAvoidingView
      style={styles.keyBoardStyle}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.wrapper}>
          <View style={styles.listWrapper}>
            <FlatList
              data={combinedData}
              keyExtractor={(item) => item?.id}
              renderItem={renderItem}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={loading ? <ActivityIndicator size="small" color="blue" /> : null}
              keyboardShouldPersistTaps="handled"
              inverted
            />
          </View>
          <View style={styles.textInputWrapper}>
            <TextInput
              value={query}
              onChangeText={handleSearch}
              placeholder="Search..."
              style={styles.textInputStyle}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  </SafeAreaView>
  );
};

export default SearchBar;
const styles = StyleSheet.create({
  nameStyle: {
    marginLeft: 10,
    color: "gray",
  },
  imageStyle: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  cardWrapper: {
    flexDirection: "row",
    padding: 10,
    alignItems: "center",
  },
  textInputStyle: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "white",
  },
  textInputWrapper: {
    flex:0.1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  listWrapper: {
    flex:0.9,
  },
  wrapper: {
    flex: 1,
  },
  keyBoardStyle: {
    flex: 1,
  },
  mainContainer: {
    height:"100%",
    backgroundColor: "white",
    paddingTop: Platform.OS === "android" ? StatusBar?.currentHeight : 0,
  },
})