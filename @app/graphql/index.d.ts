import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type Exact<T extends {
    [key: string]: unknown;
}> = {
    [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
    [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
    [SubKey in K]: Maybe<T[SubKey]>;
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: string;
    String: string;
    Boolean: boolean;
    Int: number;
    Float: number;
    BigFloat: any;
    BigInt: any;
    Cursor: any;
    Date: any;
    Datetime: string;
    JSON: {
        [key: string]: any;
    };
    Opaque: any;
    Time: any;
    UUID: any;
};
/** Boolean expression comparing fields on type "BigFloat" */
export type BigFloatFilter = {
    eq?: Maybe<Scalars['BigFloat']>;
    gt?: Maybe<Scalars['BigFloat']>;
    gte?: Maybe<Scalars['BigFloat']>;
    in?: Maybe<Array<Scalars['BigFloat']>>;
    is?: Maybe<FilterIs>;
    lt?: Maybe<Scalars['BigFloat']>;
    lte?: Maybe<Scalars['BigFloat']>;
    neq?: Maybe<Scalars['BigFloat']>;
};
/** Boolean expression comparing fields on type "BigFloatList" */
export type BigFloatListFilter = {
    containedBy?: Maybe<Array<Scalars['BigFloat']>>;
    contains?: Maybe<Array<Scalars['BigFloat']>>;
    eq?: Maybe<Array<Scalars['BigFloat']>>;
    is?: Maybe<FilterIs>;
    overlaps?: Maybe<Array<Scalars['BigFloat']>>;
};
/** Boolean expression comparing fields on type "BigInt" */
export type BigIntFilter = {
    eq?: Maybe<Scalars['BigInt']>;
    gt?: Maybe<Scalars['BigInt']>;
    gte?: Maybe<Scalars['BigInt']>;
    in?: Maybe<Array<Scalars['BigInt']>>;
    is?: Maybe<FilterIs>;
    lt?: Maybe<Scalars['BigInt']>;
    lte?: Maybe<Scalars['BigInt']>;
    neq?: Maybe<Scalars['BigInt']>;
};
/** Boolean expression comparing fields on type "BigIntList" */
export type BigIntListFilter = {
    containedBy?: Maybe<Array<Scalars['BigInt']>>;
    contains?: Maybe<Array<Scalars['BigInt']>>;
    eq?: Maybe<Array<Scalars['BigInt']>>;
    is?: Maybe<FilterIs>;
    overlaps?: Maybe<Array<Scalars['BigInt']>>;
};
/** Boolean expression comparing fields on type "Boolean" */
export type BooleanFilter = {
    eq?: Maybe<Scalars['Boolean']>;
    is?: Maybe<FilterIs>;
};
/** Boolean expression comparing fields on type "BooleanList" */
export type BooleanListFilter = {
    containedBy?: Maybe<Array<Scalars['Boolean']>>;
    contains?: Maybe<Array<Scalars['Boolean']>>;
    eq?: Maybe<Array<Scalars['Boolean']>>;
    is?: Maybe<FilterIs>;
    overlaps?: Maybe<Array<Scalars['Boolean']>>;
};
/** Boolean expression comparing fields on type "Date" */
export type DateFilter = {
    eq?: Maybe<Scalars['Date']>;
    gt?: Maybe<Scalars['Date']>;
    gte?: Maybe<Scalars['Date']>;
    in?: Maybe<Array<Scalars['Date']>>;
    is?: Maybe<FilterIs>;
    lt?: Maybe<Scalars['Date']>;
    lte?: Maybe<Scalars['Date']>;
    neq?: Maybe<Scalars['Date']>;
};
/** Boolean expression comparing fields on type "DateList" */
export type DateListFilter = {
    containedBy?: Maybe<Array<Scalars['Date']>>;
    contains?: Maybe<Array<Scalars['Date']>>;
    eq?: Maybe<Array<Scalars['Date']>>;
    is?: Maybe<FilterIs>;
    overlaps?: Maybe<Array<Scalars['Date']>>;
};
/** Boolean expression comparing fields on type "Datetime" */
export type DatetimeFilter = {
    eq?: Maybe<Scalars['Datetime']>;
    gt?: Maybe<Scalars['Datetime']>;
    gte?: Maybe<Scalars['Datetime']>;
    in?: Maybe<Array<Scalars['Datetime']>>;
    is?: Maybe<FilterIs>;
    lt?: Maybe<Scalars['Datetime']>;
    lte?: Maybe<Scalars['Datetime']>;
    neq?: Maybe<Scalars['Datetime']>;
};
/** Boolean expression comparing fields on type "DatetimeList" */
export type DatetimeListFilter = {
    containedBy?: Maybe<Array<Scalars['Datetime']>>;
    contains?: Maybe<Array<Scalars['Datetime']>>;
    eq?: Maybe<Array<Scalars['Datetime']>>;
    is?: Maybe<FilterIs>;
    overlaps?: Maybe<Array<Scalars['Datetime']>>;
};
export declare enum FilterIs {
    NotNull = "NOT_NULL",
    Null = "NULL"
}
/** Boolean expression comparing fields on type "Float" */
export type FloatFilter = {
    eq?: Maybe<Scalars['Float']>;
    gt?: Maybe<Scalars['Float']>;
    gte?: Maybe<Scalars['Float']>;
    in?: Maybe<Array<Scalars['Float']>>;
    is?: Maybe<FilterIs>;
    lt?: Maybe<Scalars['Float']>;
    lte?: Maybe<Scalars['Float']>;
    neq?: Maybe<Scalars['Float']>;
};
/** Boolean expression comparing fields on type "FloatList" */
export type FloatListFilter = {
    containedBy?: Maybe<Array<Scalars['Float']>>;
    contains?: Maybe<Array<Scalars['Float']>>;
    eq?: Maybe<Array<Scalars['Float']>>;
    is?: Maybe<FilterIs>;
    overlaps?: Maybe<Array<Scalars['Float']>>;
};
/** Boolean expression comparing fields on type "ID" */
export type IdFilter = {
    eq?: Maybe<Scalars['ID']>;
};
/** Boolean expression comparing fields on type "Int" */
export type IntFilter = {
    eq?: Maybe<Scalars['Int']>;
    gt?: Maybe<Scalars['Int']>;
    gte?: Maybe<Scalars['Int']>;
    in?: Maybe<Array<Scalars['Int']>>;
    is?: Maybe<FilterIs>;
    lt?: Maybe<Scalars['Int']>;
    lte?: Maybe<Scalars['Int']>;
    neq?: Maybe<Scalars['Int']>;
};
/** Boolean expression comparing fields on type "IntList" */
export type IntListFilter = {
    containedBy?: Maybe<Array<Scalars['Int']>>;
    contains?: Maybe<Array<Scalars['Int']>>;
    eq?: Maybe<Array<Scalars['Int']>>;
    is?: Maybe<FilterIs>;
    overlaps?: Maybe<Array<Scalars['Int']>>;
};
/** The root type for creating and mutating data */
export type Mutation = {
    __typename?: 'Mutation';
    create_organization: Maybe<Organizations>;
    /** Deletes zero or more records from the `organization_members` collection */
    deleteFromorganization_membersCollection: Organization_MembersDeleteResponse;
    /** Deletes zero or more records from the `organizations` collection */
    deleteFromorganizationsCollection: OrganizationsDeleteResponse;
    /** Deletes zero or more records from the `user_profiles` collection */
    deleteFromuser_profilesCollection: User_ProfilesDeleteResponse;
    /** Adds one or more `organization_members` records to the collection */
    insertIntoorganization_membersCollection: Maybe<Organization_MembersInsertResponse>;
    /** Adds one or more `organizations` records to the collection */
    insertIntoorganizationsCollection: Maybe<OrganizationsInsertResponse>;
    /** Adds one or more `user_profiles` records to the collection */
    insertIntouser_profilesCollection: Maybe<User_ProfilesInsertResponse>;
    /** Updates zero or more records in the `organization_members` collection */
    updateorganization_membersCollection: Organization_MembersUpdateResponse;
    /** Updates zero or more records in the `organizations` collection */
    updateorganizationsCollection: OrganizationsUpdateResponse;
    /** Updates zero or more records in the `user_profiles` collection */
    updateuser_profilesCollection: User_ProfilesUpdateResponse;
};
/** The root type for creating and mutating data */
export type MutationCreate_OrganizationArgs = {
    name: Scalars['String'];
};
/** The root type for creating and mutating data */
export type MutationDeleteFromorganization_MembersCollectionArgs = {
    atMost?: Scalars['Int'];
    filter?: Maybe<Organization_MembersFilter>;
};
/** The root type for creating and mutating data */
export type MutationDeleteFromorganizationsCollectionArgs = {
    atMost?: Scalars['Int'];
    filter?: Maybe<OrganizationsFilter>;
};
/** The root type for creating and mutating data */
export type MutationDeleteFromuser_ProfilesCollectionArgs = {
    atMost?: Scalars['Int'];
    filter?: Maybe<User_ProfilesFilter>;
};
/** The root type for creating and mutating data */
export type MutationInsertIntoorganization_MembersCollectionArgs = {
    objects: Array<Organization_MembersInsertInput>;
};
/** The root type for creating and mutating data */
export type MutationInsertIntoorganizationsCollectionArgs = {
    objects: Array<OrganizationsInsertInput>;
};
/** The root type for creating and mutating data */
export type MutationInsertIntouser_ProfilesCollectionArgs = {
    objects: Array<User_ProfilesInsertInput>;
};
/** The root type for creating and mutating data */
export type MutationUpdateorganization_MembersCollectionArgs = {
    atMost?: Scalars['Int'];
    filter?: Maybe<Organization_MembersFilter>;
    set: Organization_MembersUpdateInput;
};
/** The root type for creating and mutating data */
export type MutationUpdateorganizationsCollectionArgs = {
    atMost?: Scalars['Int'];
    filter?: Maybe<OrganizationsFilter>;
    set: OrganizationsUpdateInput;
};
/** The root type for creating and mutating data */
export type MutationUpdateuser_ProfilesCollectionArgs = {
    atMost?: Scalars['Int'];
    filter?: Maybe<User_ProfilesFilter>;
    set: User_ProfilesUpdateInput;
};
export type Node = {
    /** Retrieves a record by `ID` */
    nodeId: Scalars['ID'];
};
/** Boolean expression comparing fields on type "Opaque" */
export type OpaqueFilter = {
    eq?: Maybe<Scalars['Opaque']>;
    is?: Maybe<FilterIs>;
};
/** Defines a per-field sorting order */
export declare enum OrderByDirection {
    /** Ascending order, nulls first */
    AscNullsFirst = "AscNullsFirst",
    /** Ascending order, nulls last */
    AscNullsLast = "AscNullsLast",
    /** Descending order, nulls first */
    DescNullsFirst = "DescNullsFirst",
    /** Descending order, nulls last */
    DescNullsLast = "DescNullsLast"
}
export type PageInfo = {
    __typename?: 'PageInfo';
    endCursor: Maybe<Scalars['String']>;
    hasNextPage: Scalars['Boolean'];
    hasPreviousPage: Scalars['Boolean'];
    startCursor: Maybe<Scalars['String']>;
};
/** The root type for querying data */
export type Query = {
    __typename?: 'Query';
    current_user_organization_contexts: Maybe<Organization_MembersConnection>;
    current_user_profile: Maybe<User_Profiles>;
    /** Retrieve a record by its `ID` */
    node: Maybe<Node>;
    /** A pagable collection of type `organization_members` */
    organization_membersCollection: Maybe<Organization_MembersConnection>;
    /** A pagable collection of type `organizations` */
    organizationsCollection: Maybe<OrganizationsConnection>;
    /** A pagable collection of type `user_profiles` */
    user_profilesCollection: Maybe<User_ProfilesConnection>;
};
/** The root type for querying data */
export type QueryCurrent_User_Organization_ContextsArgs = {
    after?: Maybe<Scalars['Cursor']>;
    before?: Maybe<Scalars['Cursor']>;
    filter?: Maybe<Organization_MembersFilter>;
    first?: Maybe<Scalars['Int']>;
    last?: Maybe<Scalars['Int']>;
    offset?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Array<Organization_MembersOrderBy>>;
};
/** The root type for querying data */
export type QueryNodeArgs = {
    nodeId: Scalars['ID'];
};
/** The root type for querying data */
export type QueryOrganization_MembersCollectionArgs = {
    after?: Maybe<Scalars['Cursor']>;
    before?: Maybe<Scalars['Cursor']>;
    filter?: Maybe<Organization_MembersFilter>;
    first?: Maybe<Scalars['Int']>;
    last?: Maybe<Scalars['Int']>;
    offset?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Array<Organization_MembersOrderBy>>;
};
/** The root type for querying data */
export type QueryOrganizationsCollectionArgs = {
    after?: Maybe<Scalars['Cursor']>;
    before?: Maybe<Scalars['Cursor']>;
    filter?: Maybe<OrganizationsFilter>;
    first?: Maybe<Scalars['Int']>;
    last?: Maybe<Scalars['Int']>;
    offset?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Array<OrganizationsOrderBy>>;
};
/** The root type for querying data */
export type QueryUser_ProfilesCollectionArgs = {
    after?: Maybe<Scalars['Cursor']>;
    before?: Maybe<Scalars['Cursor']>;
    filter?: Maybe<User_ProfilesFilter>;
    first?: Maybe<Scalars['Int']>;
    last?: Maybe<Scalars['Int']>;
    offset?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Array<User_ProfilesOrderBy>>;
};
/** Boolean expression comparing fields on type "String" */
export type StringFilter = {
    eq?: Maybe<Scalars['String']>;
    gt?: Maybe<Scalars['String']>;
    gte?: Maybe<Scalars['String']>;
    ilike?: Maybe<Scalars['String']>;
    in?: Maybe<Array<Scalars['String']>>;
    iregex?: Maybe<Scalars['String']>;
    is?: Maybe<FilterIs>;
    like?: Maybe<Scalars['String']>;
    lt?: Maybe<Scalars['String']>;
    lte?: Maybe<Scalars['String']>;
    neq?: Maybe<Scalars['String']>;
    regex?: Maybe<Scalars['String']>;
    startsWith?: Maybe<Scalars['String']>;
};
/** Boolean expression comparing fields on type "StringList" */
export type StringListFilter = {
    containedBy?: Maybe<Array<Scalars['String']>>;
    contains?: Maybe<Array<Scalars['String']>>;
    eq?: Maybe<Array<Scalars['String']>>;
    is?: Maybe<FilterIs>;
    overlaps?: Maybe<Array<Scalars['String']>>;
};
/** Boolean expression comparing fields on type "Time" */
export type TimeFilter = {
    eq?: Maybe<Scalars['Time']>;
    gt?: Maybe<Scalars['Time']>;
    gte?: Maybe<Scalars['Time']>;
    in?: Maybe<Array<Scalars['Time']>>;
    is?: Maybe<FilterIs>;
    lt?: Maybe<Scalars['Time']>;
    lte?: Maybe<Scalars['Time']>;
    neq?: Maybe<Scalars['Time']>;
};
/** Boolean expression comparing fields on type "TimeList" */
export type TimeListFilter = {
    containedBy?: Maybe<Array<Scalars['Time']>>;
    contains?: Maybe<Array<Scalars['Time']>>;
    eq?: Maybe<Array<Scalars['Time']>>;
    is?: Maybe<FilterIs>;
    overlaps?: Maybe<Array<Scalars['Time']>>;
};
/** Boolean expression comparing fields on type "UUID" */
export type UuidFilter = {
    eq?: Maybe<Scalars['UUID']>;
    in?: Maybe<Array<Scalars['UUID']>>;
    is?: Maybe<FilterIs>;
    neq?: Maybe<Scalars['UUID']>;
};
/** Boolean expression comparing fields on type "UUIDList" */
export type UuidListFilter = {
    containedBy?: Maybe<Array<Scalars['UUID']>>;
    contains?: Maybe<Array<Scalars['UUID']>>;
    eq?: Maybe<Array<Scalars['UUID']>>;
    is?: Maybe<FilterIs>;
    overlaps?: Maybe<Array<Scalars['UUID']>>;
};
export declare enum Organization_Member_Role {
    Admin = "ADMIN",
    Member = "MEMBER",
    Owner = "OWNER"
}
/** Boolean expression comparing fields on type "organization_member_role" */
export type Organization_Member_RoleFilter = {
    eq?: Maybe<Organization_Member_Role>;
    in?: Maybe<Array<Organization_Member_Role>>;
    is?: Maybe<FilterIs>;
    neq?: Maybe<Organization_Member_Role>;
};
export type Organization_Members = Node & {
    __typename?: 'organization_members';
    created_at: Scalars['Datetime'];
    id: Scalars['UUID'];
    is_active: Scalars['Boolean'];
    /** Globally Unique Record Identifier */
    nodeId: Scalars['ID'];
    organization_id: Scalars['UUID'];
    organizations: Maybe<Organizations>;
    role: Organization_Member_Role;
    updated_at: Scalars['Datetime'];
    user_id: Scalars['UUID'];
};
export type Organization_MembersConnection = {
    __typename?: 'organization_membersConnection';
    edges: Array<Organization_MembersEdge>;
    pageInfo: PageInfo;
};
export type Organization_MembersDeleteResponse = {
    __typename?: 'organization_membersDeleteResponse';
    /** Count of the records impacted by the mutation */
    affectedCount: Scalars['Int'];
    /** Array of records impacted by the mutation */
    records: Array<Organization_Members>;
};
export type Organization_MembersEdge = {
    __typename?: 'organization_membersEdge';
    cursor: Scalars['String'];
    node: Organization_Members;
};
export type Organization_MembersFilter = {
    /** Returns true only if all its inner filters are true, otherwise returns false */
    and?: Maybe<Array<Organization_MembersFilter>>;
    created_at?: Maybe<DatetimeFilter>;
    id?: Maybe<UuidFilter>;
    is_active?: Maybe<BooleanFilter>;
    nodeId?: Maybe<IdFilter>;
    /** Negates a filter */
    not?: Maybe<Organization_MembersFilter>;
    /** Returns true if at least one of its inner filters is true, otherwise returns false */
    or?: Maybe<Array<Organization_MembersFilter>>;
    organization_id?: Maybe<UuidFilter>;
    role?: Maybe<Organization_Member_RoleFilter>;
    updated_at?: Maybe<DatetimeFilter>;
    user_id?: Maybe<UuidFilter>;
};
export type Organization_MembersInsertInput = {
    created_at?: Maybe<Scalars['Datetime']>;
    id?: Maybe<Scalars['UUID']>;
    is_active?: Maybe<Scalars['Boolean']>;
    organization_id?: Maybe<Scalars['UUID']>;
    role?: Maybe<Organization_Member_Role>;
    updated_at?: Maybe<Scalars['Datetime']>;
    user_id?: Maybe<Scalars['UUID']>;
};
export type Organization_MembersInsertResponse = {
    __typename?: 'organization_membersInsertResponse';
    /** Count of the records impacted by the mutation */
    affectedCount: Scalars['Int'];
    /** Array of records impacted by the mutation */
    records: Array<Organization_Members>;
};
export type Organization_MembersOrderBy = {
    created_at?: Maybe<OrderByDirection>;
    id?: Maybe<OrderByDirection>;
    is_active?: Maybe<OrderByDirection>;
    organization_id?: Maybe<OrderByDirection>;
    role?: Maybe<OrderByDirection>;
    updated_at?: Maybe<OrderByDirection>;
    user_id?: Maybe<OrderByDirection>;
};
export type Organization_MembersUpdateInput = {
    created_at?: Maybe<Scalars['Datetime']>;
    id?: Maybe<Scalars['UUID']>;
    is_active?: Maybe<Scalars['Boolean']>;
    organization_id?: Maybe<Scalars['UUID']>;
    role?: Maybe<Organization_Member_Role>;
    updated_at?: Maybe<Scalars['Datetime']>;
    user_id?: Maybe<Scalars['UUID']>;
};
export type Organization_MembersUpdateResponse = {
    __typename?: 'organization_membersUpdateResponse';
    /** Count of the records impacted by the mutation */
    affectedCount: Scalars['Int'];
    /** Array of records impacted by the mutation */
    records: Array<Organization_Members>;
};
export type Organizations = Node & {
    __typename?: 'organizations';
    created_at: Scalars['Datetime'];
    id: Scalars['UUID'];
    name: Scalars['String'];
    /** Globally Unique Record Identifier */
    nodeId: Scalars['ID'];
    organization_membersCollection: Maybe<Organization_MembersConnection>;
    updated_at: Scalars['Datetime'];
};
export type OrganizationsOrganization_MembersCollectionArgs = {
    after?: Maybe<Scalars['Cursor']>;
    before?: Maybe<Scalars['Cursor']>;
    filter?: Maybe<Organization_MembersFilter>;
    first?: Maybe<Scalars['Int']>;
    last?: Maybe<Scalars['Int']>;
    offset?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Array<Organization_MembersOrderBy>>;
};
export type OrganizationsConnection = {
    __typename?: 'organizationsConnection';
    edges: Array<OrganizationsEdge>;
    pageInfo: PageInfo;
};
export type OrganizationsDeleteResponse = {
    __typename?: 'organizationsDeleteResponse';
    /** Count of the records impacted by the mutation */
    affectedCount: Scalars['Int'];
    /** Array of records impacted by the mutation */
    records: Array<Organizations>;
};
export type OrganizationsEdge = {
    __typename?: 'organizationsEdge';
    cursor: Scalars['String'];
    node: Organizations;
};
export type OrganizationsFilter = {
    /** Returns true only if all its inner filters are true, otherwise returns false */
    and?: Maybe<Array<OrganizationsFilter>>;
    created_at?: Maybe<DatetimeFilter>;
    id?: Maybe<UuidFilter>;
    name?: Maybe<StringFilter>;
    nodeId?: Maybe<IdFilter>;
    /** Negates a filter */
    not?: Maybe<OrganizationsFilter>;
    /** Returns true if at least one of its inner filters is true, otherwise returns false */
    or?: Maybe<Array<OrganizationsFilter>>;
    updated_at?: Maybe<DatetimeFilter>;
};
export type OrganizationsInsertInput = {
    created_at?: Maybe<Scalars['Datetime']>;
    id?: Maybe<Scalars['UUID']>;
    name?: Maybe<Scalars['String']>;
    updated_at?: Maybe<Scalars['Datetime']>;
};
export type OrganizationsInsertResponse = {
    __typename?: 'organizationsInsertResponse';
    /** Count of the records impacted by the mutation */
    affectedCount: Scalars['Int'];
    /** Array of records impacted by the mutation */
    records: Array<Organizations>;
};
export type OrganizationsOrderBy = {
    created_at?: Maybe<OrderByDirection>;
    id?: Maybe<OrderByDirection>;
    name?: Maybe<OrderByDirection>;
    updated_at?: Maybe<OrderByDirection>;
};
export type OrganizationsUpdateInput = {
    created_at?: Maybe<Scalars['Datetime']>;
    id?: Maybe<Scalars['UUID']>;
    name?: Maybe<Scalars['String']>;
    updated_at?: Maybe<Scalars['Datetime']>;
};
export type OrganizationsUpdateResponse = {
    __typename?: 'organizationsUpdateResponse';
    /** Count of the records impacted by the mutation */
    affectedCount: Scalars['Int'];
    /** Array of records impacted by the mutation */
    records: Array<Organizations>;
};
export type User_Profiles = Node & {
    __typename?: 'user_profiles';
    created_at: Scalars['Datetime'];
    firstname: Scalars['String'];
    id: Scalars['UUID'];
    is_admin: Scalars['Boolean'];
    lastname: Scalars['String'];
    /** Globally Unique Record Identifier */
    nodeId: Scalars['ID'];
    updated_at: Scalars['Datetime'];
};
export type User_ProfilesConnection = {
    __typename?: 'user_profilesConnection';
    edges: Array<User_ProfilesEdge>;
    pageInfo: PageInfo;
};
export type User_ProfilesDeleteResponse = {
    __typename?: 'user_profilesDeleteResponse';
    /** Count of the records impacted by the mutation */
    affectedCount: Scalars['Int'];
    /** Array of records impacted by the mutation */
    records: Array<User_Profiles>;
};
export type User_ProfilesEdge = {
    __typename?: 'user_profilesEdge';
    cursor: Scalars['String'];
    node: User_Profiles;
};
export type User_ProfilesFilter = {
    /** Returns true only if all its inner filters are true, otherwise returns false */
    and?: Maybe<Array<User_ProfilesFilter>>;
    created_at?: Maybe<DatetimeFilter>;
    firstname?: Maybe<StringFilter>;
    id?: Maybe<UuidFilter>;
    is_admin?: Maybe<BooleanFilter>;
    lastname?: Maybe<StringFilter>;
    nodeId?: Maybe<IdFilter>;
    /** Negates a filter */
    not?: Maybe<User_ProfilesFilter>;
    /** Returns true if at least one of its inner filters is true, otherwise returns false */
    or?: Maybe<Array<User_ProfilesFilter>>;
    updated_at?: Maybe<DatetimeFilter>;
};
export type User_ProfilesInsertInput = {
    created_at?: Maybe<Scalars['Datetime']>;
    firstname?: Maybe<Scalars['String']>;
    id?: Maybe<Scalars['UUID']>;
    is_admin?: Maybe<Scalars['Boolean']>;
    lastname?: Maybe<Scalars['String']>;
    updated_at?: Maybe<Scalars['Datetime']>;
};
export type User_ProfilesInsertResponse = {
    __typename?: 'user_profilesInsertResponse';
    /** Count of the records impacted by the mutation */
    affectedCount: Scalars['Int'];
    /** Array of records impacted by the mutation */
    records: Array<User_Profiles>;
};
export type User_ProfilesOrderBy = {
    created_at?: Maybe<OrderByDirection>;
    firstname?: Maybe<OrderByDirection>;
    id?: Maybe<OrderByDirection>;
    is_admin?: Maybe<OrderByDirection>;
    lastname?: Maybe<OrderByDirection>;
    updated_at?: Maybe<OrderByDirection>;
};
export type User_ProfilesUpdateInput = {
    created_at?: Maybe<Scalars['Datetime']>;
    firstname?: Maybe<Scalars['String']>;
    id?: Maybe<Scalars['UUID']>;
    is_admin?: Maybe<Scalars['Boolean']>;
    lastname?: Maybe<Scalars['String']>;
    updated_at?: Maybe<Scalars['Datetime']>;
};
export type User_ProfilesUpdateResponse = {
    __typename?: 'user_profilesUpdateResponse';
    /** Count of the records impacted by the mutation */
    affectedCount: Scalars['Int'];
    /** Array of records impacted by the mutation */
    records: Array<User_Profiles>;
};
export type CurrentUserOrganizationContextsQueryVariables = Exact<{
    [key: string]: never;
}>;
export type CurrentUserOrganizationContextsQuery = ({
    __typename?: 'Query';
} & {
    currentUserOrganizationContexts: Maybe<({
        __typename?: 'organization_membersConnection';
    } & {
        edges: Array<({
            __typename?: 'organization_membersEdge';
        } & {
            node: ({
                __typename?: 'organization_members';
            } & Pick<Organization_Members, 'role'> & {
                organizationId: Organization_Members['organization_id'];
            } & {
                organizations: Maybe<({
                    __typename?: 'organizations';
                } & Pick<Organizations, 'id' | 'name'>)>;
            });
        })>;
    })>;
});
export type CurrentUserProfileQueryVariables = Exact<{
    [key: string]: never;
}>;
export type CurrentUserProfileQuery = ({
    __typename?: 'Query';
} & {
    currentUserProfile: Maybe<({
        __typename?: 'user_profiles';
    } & Pick<User_Profiles, 'nodeId' | 'id' | 'firstname' | 'lastname'> & {
        isAdmin: User_Profiles['is_admin'];
    })>;
});
export declare const CurrentUserOrganizationContextsDocument: Apollo.DocumentNode;
/**
 * __useCurrentUserOrganizationContextsQuery__
 *
 * To run a query within a React component, call `useCurrentUserOrganizationContextsQuery` and pass it any options that fit your needs.
 * When your component renders, `useCurrentUserOrganizationContextsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCurrentUserOrganizationContextsQuery({
 *   variables: {
 *   },
 * });
 */
export declare function useCurrentUserOrganizationContextsQuery(baseOptions?: Apollo.QueryHookOptions<CurrentUserOrganizationContextsQuery, CurrentUserOrganizationContextsQueryVariables>): Apollo.QueryResult<CurrentUserOrganizationContextsQuery, Exact<{
    [key: string]: never;
}>>;
export declare function useCurrentUserOrganizationContextsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CurrentUserOrganizationContextsQuery, CurrentUserOrganizationContextsQueryVariables>): Apollo.LazyQueryResultTuple<CurrentUserOrganizationContextsQuery, Exact<{
    [key: string]: never;
}>>;
export type CurrentUserOrganizationContextsQueryHookResult = ReturnType<typeof useCurrentUserOrganizationContextsQuery>;
export type CurrentUserOrganizationContextsLazyQueryHookResult = ReturnType<typeof useCurrentUserOrganizationContextsLazyQuery>;
export type CurrentUserOrganizationContextsQueryResult = Apollo.QueryResult<CurrentUserOrganizationContextsQuery, CurrentUserOrganizationContextsQueryVariables>;
export declare const CurrentUserProfileDocument: Apollo.DocumentNode;
/**
 * __useCurrentUserProfileQuery__
 *
 * To run a query within a React component, call `useCurrentUserProfileQuery` and pass it any options that fit your needs.
 * When your component renders, `useCurrentUserProfileQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCurrentUserProfileQuery({
 *   variables: {
 *   },
 * });
 */
export declare function useCurrentUserProfileQuery(baseOptions?: Apollo.QueryHookOptions<CurrentUserProfileQuery, CurrentUserProfileQueryVariables>): Apollo.QueryResult<CurrentUserProfileQuery, Exact<{
    [key: string]: never;
}>>;
export declare function useCurrentUserProfileLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CurrentUserProfileQuery, CurrentUserProfileQueryVariables>): Apollo.LazyQueryResultTuple<CurrentUserProfileQuery, Exact<{
    [key: string]: never;
}>>;
export type CurrentUserProfileQueryHookResult = ReturnType<typeof useCurrentUserProfileQuery>;
export type CurrentUserProfileLazyQueryHookResult = ReturnType<typeof useCurrentUserProfileLazyQuery>;
export type CurrentUserProfileQueryResult = Apollo.QueryResult<CurrentUserProfileQuery, CurrentUserProfileQueryVariables>;
//# sourceMappingURL=index.d.ts.map