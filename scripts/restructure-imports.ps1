$base = "d:\3rd-yr-Acads\2nd-Sem_2nd-term\capstone\project-cloie\src"

# Define all import path mappings (old -> new)
$mappings = @(
    # Identity-access -> Auth feature
    @{ Old = '@/modules/identity-access/services/'; New = '@/features/auth/services/' },
    @{ Old = '@/modules/identity-access/policies/'; New = '@/features/auth/policies/' },

    # Components/auth -> Auth feature components
    @{ Old = '@/components/auth/'; New = '@/features/auth/components/' },

    # Student-evaluation-workflow -> Responses feature
    @{ Old = '@/modules/student-evaluation-workflow/services/'; New = '@/features/responses/services/' },
    @{ Old = '@/modules/student-evaluation-workflow/answer-keys'; New = '@/features/responses/answer-keys' },
    @{ Old = '@/modules/student-evaluation-workflow/types'; New = '@/features/responses/types' },

    # Components/student/evaluations -> Responses feature components
    @{ Old = '@/components/student/evaluations/'; New = '@/features/responses/components/' },

    # Components/student/dashboard -> Users feature components
    @{ Old = '@/components/student/dashboard/'; New = '@/features/users/components/' },

    # Components/faculty -> Evaluations feature components
    @{ Old = '@/components/faculty/'; New = '@/features/evaluations/components/' },

    # Components/course-bound-review -> Analytics feature components
    @{ Old = '@/components/course-bound-review/'; New = '@/features/analytics/components/' },

    # Academic-catalog-and-context -> Academic-structure feature
    @{ Old = '@/modules/academic-catalog-and-context/services/'; New = '@/features/academic-structure/services/' },

    # Analytics-reporting-and-review -> Analytics feature
    @{ Old = '@/modules/analytics-reporting-and-review/services/'; New = '@/features/analytics/services/' },
    @{ Old = '@/modules/analytics-reporting-and-review/types'; New = '@/features/analytics/types' },

    # Deployments-and-targeting -> Evaluations feature
    @{ Old = '@/modules/deployments-and-targeting/services/'; New = '@/features/evaluations/services/' },
    @{ Old = '@/modules/deployments-and-targeting/types'; New = '@/features/evaluations/types' },

    # User-lifecycle-profiles -> Users feature
    @{ Old = '@/modules/user-lifecycle-profiles/services/'; New = '@/features/users/services/' }
)

# Get all .ts and .tsx files in src
$files = Get-ChildItem -Path $base -Recurse -Include "*.ts","*.tsx" -File

$totalChanges = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    if ($null -eq $content) { continue }

    $originalContent = $content
    $fileChanged = $false

    foreach ($mapping in $mappings) {
        if ($content.Contains($mapping.Old)) {
            $content = $content.Replace($mapping.Old, $mapping.New)
            $fileChanged = $true
        }
    }

    if ($fileChanged) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $relativePath = $file.FullName.Replace($base + "\", "")
        Write-Host "Updated: $relativePath"
        $totalChanges++
    }
}

Write-Host "`nTotal files updated: $totalChanges"
