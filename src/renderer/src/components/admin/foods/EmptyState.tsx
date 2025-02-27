"use client";

import React, { useState } from "react";
import ShoppingBags from "@/assets/images/shopping-bags.svg";
import AddFoodModal from "./modals/AddFoodModal";

function EmptyState() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="w-full mt-44 md:mt-32 flex items-center justify-center">
        <div className="flex justify-center items-center flex-col gap-3">
          <div className="bg-[#F5F5F5] border-[#7474748F] rounded-2xl flex items-center justify-center flex-col py-20 px-28  border-dashed border-2 space-y-4">
            <img
              src={ShoppingBags}
              alt="Shopping bags"
              width={100}
              height={100}
            />
            <h1 className="text-center text-secondary">No food yet!</h1>
          </div>
          <div className="w-full">
            <button
              onClick={() => setModalOpen(true)}
              className="bg-primary-700 w-full text-white px-4 py-4 rounded-lg font-bold text-sm"
            >
              Add Foods
            </button>
          </div>
        </div>

        <AddFoodModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      </div>
    </>
  );
}

export default EmptyState;
