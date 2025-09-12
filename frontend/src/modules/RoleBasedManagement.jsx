import React, { useState, useEffect } from 'react'
import { roleService } from '../services/roleService'
import { Plus, Edit, Trash2, X, Check, Shield } from 'lucide-react'

const RoleBasedManagement = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [roles, setRoles] = useState([])
  const [modules, setModules] = useState([])
  const [permissions, setPermissions] = useState([])

  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [rolePermissions, setRolePermissions] = useState([])

  const [newRole, setNewRole] = useState({ name: '', description: '', level: 1 })
  const [assign, setAssign] = useState({ permissionId: '', userId: '', roleId: '' })

  const loadAll = async () => {
    try {
      setLoading(true)
      setError('')
      const [r, m, p] = await Promise.all([
        roleService.getAllRoles(),
        roleService.getAllModules(),
        roleService.getAllPermissions()
      ])
      setRoles(r.data || [])
      setModules(m.data || [])
      setPermissions(p.data || [])
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadRolePerms = async (roleId) => {
    if (!roleId) return setRolePermissions([])
    try {
      setLoading(true)
      const res = await roleService.getRolePermissions(roleId)
      setRolePermissions(res.data || [])
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to fetch role permissions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])
  useEffect(() => { loadRolePerms(selectedRoleId) }, [selectedRoleId])

  const groupedPermsByModule = useMemo(() => {
    const map = {}
    for (const perm of permissions) {
      const moduleKey = perm.module_key || perm.module || 'general'
      if (!map[moduleKey]) map[moduleKey] = []
      map[moduleKey].push(perm)
    }
    return map
  }, [permissions])

  const roleOptions = useMemo(() => roles.map(r => ({ value: String(r.id), label: `${r.name} (L${r.level ?? '-'} )` })), [roles])
  const permOptions = useMemo(() => permissions.map(p => ({ value: String(p.id), label: `${p.key || p.permission_key}` })), [permissions])

  const handleCreateRole = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await roleService.createRole(newRole)
      setNewRole({ name: '', description: '', level: 1 })
      await loadAll()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create role')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignPermission = async () => {
    if (!selectedRoleId || !assign.permissionId) return
    try {
      setLoading(true)
      await roleService.assignPermissionToRole(Number(selectedRoleId), Number(assign.permissionId))
      await loadRolePerms(selectedRoleId)
      setAssign({ ...assign, permissionId: '' })
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to assign permission')
    } finally {
      setLoading(false)
    }
  }

  const handleRevokePermission = async (permissionId) => {
    try {
      setLoading(true)
      await roleService.revokePermissionFromRole(Number(selectedRoleId), Number(permissionId))
      await loadRolePerms(selectedRoleId)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to revoke permission')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Shield className="h-7 w-7 text-primary-500 mr-2" />
          <h1 className="text-2xl font-bold">Role & Permission Management</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">{error}</div>
      )}

      {loading && (
        <div className="flex items-center text-gray-600"><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading...</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Roles and Create */}
        <div className="xl:col-span-1 space-y-6">
          <Section title="Roles" icon={Users}>
            <div className="space-y-3">
              <Select
                value={selectedRoleId}
                onChange={setSelectedRoleId}
                options={roleOptions}
                placeholder="Select a role"
              />
              <div className="text-xs text-gray-500">Total roles: {roles.length}</div>
            </div>
          </Section>

          <Section title="Create New Role" icon={Plus}>
            <form onSubmit={handleCreateRole} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Role Name</label>
                <input
                  type="text"
                  required
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                  placeholder="e.g., Analyst"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                  placeholder="What can this role do?"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Level</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={newRole.level}
                  onChange={(e) => setNewRole({ ...newRole, level: Number(e.target.value) })}
                  className="mt-1 w-28 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-1" /> Create Role
              </button>
            </form>
          </Section>
        </div>

        {/* Middle: Role permissions */}
        <div className="xl:col-span-2 space-y-6">
          <Section
            title="Role Permissions"
            icon={Shield}
            actions={[
              <div key="assign" className="flex items-center space-x-2">
                <Select
                  value={assign.permissionId}
                  onChange={(v) => setAssign({ ...assign, permissionId: v })}
                  options={permOptions}
                  placeholder="Add permission"
                />
                <button className="btn-secondary" onClick={handleAssignPermission} disabled={!selectedRoleId || !assign.permissionId}>
                  <Check className="h-4 w-4 mr-1" /> Assign
                </button>
              </div>
            ]}
          >
            {!selectedRoleId ? (
              <div className="text-gray-500 text-sm">Select a role to view and manage permissions.</div>
            ) : (
              <div className="space-y-4">
                {Object.keys(groupedPermsByModule).length === 0 ? (
                  <div className="text-gray-500 text-sm">No permissions found.</div>
                ) : (
                  Object.entries(groupedPermsByModule).map(([moduleKey, perms]) => {
                    const modulePermIds = new Set(rolePermissions.map(rp => rp.id ?? rp.permission_id))
                    return (
                      <div key={moduleKey} className="border rounded-md">
                        <div className="px-4 py-2 bg-gray-50 border-b font-medium text-gray-700">
                          {moduleKey}
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                          {perms.map(perm => {
                            const isAssigned = modulePermIds.has(perm.id)
                            return (
                              <div key={perm.id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <div className="text-sm font-medium">{perm.key || perm.permission_key}</div>
                                  {perm.description && (
                                    <div className="text-xs text-gray-500">{perm.description}</div>
                                  )}
                                </div>
                                <div>
                                  {isAssigned ? (
                                    <button className="btn-danger" onClick={() => handleRevokePermission(perm.id)}>
                                      <Trash2 className="h-4 w-4 mr-1" /> Revoke
                                    </button>
                                  ) : (
                                    <button className="btn-secondary" onClick={() => handleAssignPermission(perm.id)}>
                                      <Check className="h-4 w-4 mr-1" /> Assign
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}

export default RoleBasedManagement

