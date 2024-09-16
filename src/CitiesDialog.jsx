import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Cross2Icon,
  PlusCircledIcon,
  PlusIcon,
  MinusIcon,
  MinusCircledIcon,
  CircleIcon,
} from "@radix-ui/react-icons";
import * as cityTimeZones from "city-timezones";
const CitiesDialog = ({ addedCities, addCity, removeCity }) => {
  // console.log(addedCities);
  let [search, setSearch] = useState("");
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="text-white inline-flex items-center justify-center rounded-full border border-white py-3 bg-black px-4 font-medium leading-none  focus:outline-none">
          Edit Cities
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black data-[state=open]:animate-overlayShow fixed inset-0" />
        <Dialog.Content
          aria-describedby="List of Cities"
          className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 focus:outline-none"
        >
          <Dialog.Title className="hidden">Edit Cities</Dialog.Title>

          <div>
            <input
              placeholder="Search City or Country"
              className="border border-gray-400 rounded px-2 py-0.5 font-bold"
              type={"text"}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
            />
            <div className="flex flex-col divide-y h-60 overflow-y-scroll border-y border-neutral-500 mt-4">
              {(search === ""
                ? addedCities
                : cityTimeZones.findFromCityStateProvince(search)
              ).map((result) => {
                return (
                  <div className="py-2 px-2 flex flex-row justify-between items-center">
                    <div className="flex-1">
                      <div className="font-bold leading-none pb-1">
                        {result.city}
                      </div>
                      <div className="text-sm text-gray-500 leading-none">
                        {result.country}
                      </div>
                    </div>
                    {addedCities &&
                    addedCities.filter(
                      (match) =>
                        match.city === result.city &&
                        match.country === result.country
                    ).length > 0 ? (
                      <div className="mr-1">
                        <button
                          className="border p-1 border-gray-500 rounded"
                          onClick={(_) => removeCity(result)}
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="mr-1">
                        <button
                          className="border p-1 border-gray-500 rounded"
                          onClick={(_) => addCity(result)}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Dialog.Close asChild>
            <button
              className="text-black hover:bg-gray-200 absolute top-3 right-4 inline-flex h-6 w-6 appearance-none items-center justify-center rounded-full  focus:outline-none"
              aria-label="Close"
            >
              <Cross2Icon />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default CitiesDialog;
