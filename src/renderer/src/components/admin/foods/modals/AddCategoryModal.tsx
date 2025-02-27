import { categoriesApi } from "@renderer/api/client";
import { useConnectionStore } from "@renderer/store/connection";
import React, { useState } from "react";
import toast from "react-hot-toast";

const AddCategoryModal = ({ isOpen, onClose, onAddCategory }) => {
  const [categoryName, setCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const host = useConnectionStore((state) => state.host)
  const port = useConnectionStore((state) => state.port)

  const handleAddCategory = async () => {
    setIsLoading(true);
    if (!categoryName.trim()) {
      toast.error("Category name cannot be empty.");
      setIsLoading(false);
      return;
    }

    try {
      const baseUrl = `http://${host}:${port}/api`
      const response = await categoriesApi.create(baseUrl, { name: categoryName });
      onAddCategory(response.data);
      setCategoryName("");
    } catch (error) {
      console.error("Error adding category:", error);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#000000db]">
      <div className="bg-white rounded-2xl p-6 w-full md:min-w-[400px] max-w-md shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Add New Category</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
        <input
          type="text"
          placeholder="Category Name"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          className="w-full px-3 py-2 border border-secondary rounded-lg mb-4"
        />
        <button
          onClick={handleAddCategory}
          className={`w-full ${isLoading ? 'bg-primary-500' : 'bg-primary-700'} text-white py-2 rounded-lg`}
          disabled={isLoading}
        >
          {isLoading ? "Adding..." : "Add Category"}
        </button>
      </div>
    </div>
  );
};

export default AddCategoryModal;
