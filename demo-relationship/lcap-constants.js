export const lcapEntityArray = ['LCAPRolePerMapping', 'LCAPPerResMapping', 'LCAPUserRoleMapping', 'LCAPRole', 'LCAPPermission', 'LCAPResource'];
export const lcapStructureArray = ['LoadPermissionResourceTableViewStructure', 'LoadPermissionManagementTableViewStructure', 'LCAPGetUserResourcesStructure', 'ResourceResult', 'LoadAddRoleUserSelectLCAPRoleStructure', 'LCAPGetResourceListByRoleIdStructure', 'LCAPGetScopeResourceByRoleIdStructure', 'LCAPGetMappingByPermissionIdAndResourceIdStructure', 'LoadRoleManagementTableViewStructure', 'LoadURMTableViewStructure', 'LoadAddRoleUserTableViewStructure', 'GetRoleBindUserListStructure', 'GetMappingIdByRoleIdAndUserIdStructure', 'LCAPGetRoleListByNameStructure', 'LoadPermissionResourceListViewStructure', 'GetPermissionByRoleIdStructure', 'LCAPRoleBindUsersBody', 'LCAPGetRolePermissionListStructure', 'IsExistRoleIdStructure']
export const lcapLogicArray =  ['LCAPRoleBindUsers', 'LCAPLoadPermissionManagementTableView', 'isExistRoleId', 'LCAPLoadPermissionResourceListView', 'LCAPGetMappingByPermissionIdAndResourceId', 'LCAPGetScopeResourceByRoleId', 'loadAddRoleUserTableView', 'LCAPGetRoleBindUserList', 'LCAPLoadRoleManagementTableView', 'unBindUsers', 'LCAPLoadUserRoleMappingTableView', 'LCAPGetRolePermissionList', 'LCAPLoadAddRoleUserSelectLCAPRole', 'LCAPGetUserResources', 'LCAPGetPermissionByRoleId', 'LCAPGetResourceListByRoleId', 'LCAPGetMappingIdByRoleIdAndUserId', 'LCAPIsAlreadBindUserIdList', 'LCAPLoadResourceTableView', 'LCAPIsRoleNameRepeated']

export function lcapFilterEntityName(name) {
    return lcapEntityArray.find(n => name.includes(n));
}
export function lcapFilterStructureName(name) {
    return lcapStructureArray.find(n => name.includes(n));
}
export function lcapFilterLogicName(name) {
    return lcapLogicArray.find(n => name.includes(n));
}

export function primaryFilter(name) {
    return name.startsWith('nasl.core.');
}