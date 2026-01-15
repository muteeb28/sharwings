import { motion } from "framer-motion";
import { Trash, Star, EllipsisVertical } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { getOptimizedImageUrl } from "../lib/imageUtils";

export default function WarrantyClaimsAdminDashboard() {

    const [claims, setClaims] = useState([]);

  useEffect(() => {
    const getWarrantyTicktes = async () => {
      try {
        const response = await axios.get("/products/warranty/claim/dashboard");
        console.log(response);
        setClaims(response.data);
      } catch (error) {
        toast.error(error.response?.data?.error || "failed to update product");
      }
    };

    getWarrantyTicktes();
  }, []);

  const handleProductWarrentyStatus = async (e) => {
    const claimId = e.target.closest("tr").getAttribute("data-claim-id");
    const status = e.target.value;

    try {
      await axios.put(`/products/warranty/claim/${claimId}`, { status });
      setClaims((prevClaims) =>
        prevClaims.map((claim) =>
          claim._id === claimId ? { ...claim, status } : claim
        )
      );
      toast.success("Claim status updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update claim status");
    } finally {
      e.target.blur(); // Remove focus from the select element after change
    }
  }

  return (
    <motion.div
      className="bg-gray-800 shadow-lg rounded-lg overflow-x-scroll max-w-7xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <table className=" min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-700">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              Product
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              Name
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              Email
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              Raised At
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              Status
            </th>
          </tr>
        </thead>

        <tbody className="bg-gray-800 divide-y divide-gray-700">
          {claims?.map((claim) => (
            <tr key={claim._id} className="hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <img
                      className="h-10 w-10 rounded-full object-cover"
                      src={getOptimizedImageUrl(claim.imageUrl, { width: 80 })}
                      alt={claim.productName}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-white max-w-xl text-wrap">
                      {claim.productName}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-300">
                  {claim.user?.name}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-300">
                  {claim.user?.email}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-300">
                  {claim.createdAt?.split('T')[0]}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-300">
                  <select name="cars" id="cars" defaultValue={claim.status} onChange={handleProductWarrentyStatus} className="bg-gray-700 text-gray-300 border border-gray-600 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
