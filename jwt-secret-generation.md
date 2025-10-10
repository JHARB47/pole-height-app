# Generate secure JWT secrets (64 bytes each)
# Run these commands to generate secure random hex strings:

# For JWT_SECRET:
openssl rand -hex 64

# For REFRESH_TOKEN_SECRET:  
openssl rand -hex 64

# Example output (don't use these in production):
# JWT_SECRET=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
# REFRESH_TOKEN_SECRET=fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba
