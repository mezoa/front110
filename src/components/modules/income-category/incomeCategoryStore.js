import axios from "axios";
import { configureStore } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";
import formatValidationErrors from "../../utils/format-validation-error";
import { pushNotification } from "../../shared/notification/notificationstore";

const initialState = {
    current_page: 1,
    total_pages: 0,
    limit: 10,
    q_name: "",
    income_categories: [],
    edit_income_category_id: null,
    view_income_category_id: null,
    add_income_category_errors: {},
    edit_income_category_errors: {},
    current_income_category_item: {
        id: "",
        name: "",
    },
};

const incomeCategoryReducer = (state = initialState, action) => {
    switch (action.type) {
        case "RESET_CURRENT_INCOME_CAT_DATA":
            return {
                ...state,
                current_income_category_item: {
                    id: "",
                    name: "",
                },
                add_income_category_errors: [],
                edit_income_category_errors: [],
            };
        case "SET_INCOME_CATEGORIES":
            return {
                ...state,
                income_categories: action.payload,
            };
        case "SET_PAGINATION":
            return {
                ...state,
                total_pages: action.payload.total_pages,
                current_page: action.payload.current_page,
                limit: action.payload.limit,
                q_name: action.payload.q_name,
            };
        case "SET_CURRENT_INCOME_CATEGORY_ITEM":
            return {
                ...state,
                current_income_category_item: action.payload,
            };
        case "SET_ADD_INCOME_CATEGORY_ERRORS":
            return {
                ...state,
                add_income_category_errors: action.payload,
            };
        case "SET_EDIT_INCOME_CATEGORY_ERRORS":
            return {
                ...state,
                edit_income_category_errors: action.payload,
            };
        default:
            return state;
    }
};

const store = configureStore({
    reducer: incomeCategoryReducer,
});

export const useIncomeCategoryStore = () => {
    const dispatch = useDispatch();

    const resetCurrentIncomeCatData = () => {
        dispatch({ type: "RESET_CURRENT_INCOME_CAT_DATA" });
    };

    const fetchCatList = () => {
        return new Promise((resolve, reject) => {
            axios
                .get(`/api/income-categories/list`)
                .then((response) => {
                    resolve(response.data.data);
                })
                .catch((errors) => {
                    reject(errors);
                });
        });
    };

    const fetchIncomeCats = (page, limit, q_name = "") => {
        return new Promise((resolve, reject) => {
            axios
                .get(`/api/income-categories?page=${page}&limit=${limit}&name=${q_name}`)
                .then((response) => {
                    dispatch({ type: "SET_INCOME_CATEGORIES", payload: response.data.data });
                    if (response.data.meta) {
                        dispatch({
                            type: "SET_PAGINATION",
                            payload: {
                                total_pages: response.data.meta.last_page,
                                current_page: response.data.meta.current_page,
                                limit: response.data.meta.per_page,
                                q_name: q_name,
                            },
                        });
                    }
                    resolve(response.data.data);
                })
                .catch((errors) => {
                    reject(errors);
                });
        });
    };

    const fetchIncomeCat = (id) => {
        return new Promise((resolve, reject) => {
            axios
                .get(`/api/income-categories/${id}`)
                .then((response) => {
                    dispatch({ type: "SET_CURRENT_INCOME_CATEGORY_ITEM", payload: response.data.data });
                    resolve(response.data.data);
                })
                .catch((errors) => {
                    reject(errors);
                });
        });
    };

    const addIncomeCat = (data) => {
        return new Promise((resolve, reject) => {
            axios
                .post(`/api/income-categories`, data)
                .then((response) => {
                    resetCurrentIncomeCatData();
                    dispatch(
                        pushNotification({
                            message: "IncomeCat Added Successfully",
                            type: "success",
                            time: 2000,
                        })
                    );
                    resolve();
                })
                .catch((error) => {
                    dispatch(
                        pushNotification({
                            message: "Error Occurred",
                            type: "error",
                            time: 2000,
                        })
                    );
                    if (error.response.status == 422) {
                        dispatch({
                            type: "SET_ADD_INCOME_CATEGORY_ERRORS",
                            payload: formatValidationErrors(error.response.data.errors),
                        });
                    }
                    reject(error);
                });
        });
    };

    const editIncomeCat = (data) => {
        return new Promise((resolve, reject) => {
            axios
                .put(`/api/income-categories/${store.getState().edit_income_category_id}`, data)
                .then((response) => {
                    resetCurrentIncomeCatData();
                    dispatch(
                        pushNotification({
                            message: "income category updated successfully",
                            type: "success",
                        })
                    );
                    resolve(response);
                })
                .catch((errors) => {
                    console.log(errors);
                    dispatch(
                        pushNotification({
                            message: "Error Occurred",
                            type: "error",
                        })
                    );
                    if (errors.response.status == 422) {
                        dispatch({
                            type: "SET_EDIT_INCOME_CATEGORY_ERRORS",
                            payload: formatValidationErrors(errors.response.data.errors),
                        });
                    }
                    reject(errors);
                });
        });
    };

    const deleteIncomeCat = (id) => {
        return new Promise((resolve, reject) => {
            axios
                .delete(`/api/income-categories/${id}`)
                .then((response) => {
                    if (
                        store.getState().income_categories.length == 1 ||
                        (Array.isArray(id) && id.length == store.getState().income_categories.length)
                    ) {
                        store.getState().current_page == 1
                            ? dispatch({ type: "SET_PAGINATION", payload: { current_page: 1 } })
                            : dispatch({ type: "SET_PAGINATION", payload: { current_page: store.getState().current_page - 1 } });
                    }

                    resetCurrentIncomeCatData();
                    dispatch(
                        pushNotification({
                            message: "income category deleted successfully",
                            type: "success",
                            time: 2000,
                        })
                    );
                    resolve(response);
                })
                .catch((errors) => {
                    if (
                        errors.response.data.error_type &&
                        errors.response.data.error_type == "HAS_CHILD_ERROR"
                    ) {
                        dispatch(
                            pushNotification({
                                message:
                                    "Category is associated with non zero income records. Delete that incomes first.",
                                type: "error",
                                time: 5000,
                            })
                        );
                    }

                    reject(errors);
                });
        });
    };

    return {
        resetCurrentIncomeCatData,
        fetchCatList,
        fetchIncomeCats,
        fetchIncomeCat,
        addIncomeCat,
        editIncomeCat,
        deleteIncomeCat,
    };
};
